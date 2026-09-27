-- Endurecimento do CRM (revisão de segurança e consistência)

-- 1. Ninguém vira admin sozinho no cadastro. O primeiro admin é promovido à mão,
--    depois que o dono confirma o e-mail e entra com a própria senha (ver README).
create or replace function public.novo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, email, nome)
  values (new.id, new.email, left(coalesce(nullif(trim(new.raw_user_meta_data->>'nome'), ''), split_part(new.email, '@', 1)), 80));
  return new;
end $$;

-- 2. perfis: id, e-mail e data fixos; sempre sobra pelo menos um admin ativo
create or replace function privado.protege_perfis() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.id := old.id; new.email := old.email; new.criado_em := old.criado_em;
  if old.papel = 'admin' and old.ativo and (new.papel <> 'admin' or not new.ativo)
     and not exists (select 1 from public.perfis where papel = 'admin' and ativo and id <> old.id) then
    raise exception 'Precisa sobrar pelo menos um administrador ativo.';
  end if;
  return new;
end $$;
create trigger t_perfis_protege before update on public.perfis
  for each row execute function privado.protege_perfis();

-- 3. tarefas: o criador é quem criou (não dá pra "adotar" a tarefa e apagar)
create or replace function privado.criador_fixo() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then new.criado_por := coalesce(auth.uid(), new.criado_por);
  else new.criado_por := old.criado_por; end if;
  return new;
end $$;
create trigger t_tarefas_criador before insert or update on public.tarefas
  for each row execute function privado.criador_fixo();

-- 4. tarefa criada já como "feito" também ganha data de conclusão
create or replace function public.marcar_conclusao() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.status = 'feito' and (tg_op = 'INSERT' or old.status is distinct from 'feito') then new.concluida_em := now();
  elsif new.status <> 'feito' then new.concluida_em := null; end if;
  return new;
end $$;
drop trigger t_tarefas_conclusao on public.tarefas;
create trigger t_tarefas_conclusao before insert or update on public.tarefas
  for each row execute function public.marcar_conclusao();

-- 5. leads: quando entrou na etapa atual (o painel conta fechamentos do mês por aqui)
alter table public.leads add column etapa_em timestamptz not null default now();
update public.leads l set etapa_em = coalesce(
  (select max(a.criado_em) from public.atividades a where a.lead_id = l.id and a.tipo = 'etapa'), l.criado_em);
create or replace function privado.marcar_etapa_em() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.etapa_id is distinct from old.etapa_id then new.etapa_em := now(); end if;
  return new;
end $$;
create trigger t_leads_etapa_em before update on public.leads
  for each row execute function privado.marcar_etapa_em();

-- 6. valor mensal e vencimento só pro admin: tabela própria com RLS de admin
create table public.clientes_financeiro (
  cliente_id uuid primary key references public.clientes(id) on delete cascade,
  valor_mensal numeric check (valor_mensal >= 0),
  dia_vencimento smallint check (dia_vencimento between 1 and 31),
  atualizado_em timestamptz not null default now()
);
alter table public.clientes_financeiro enable row level security;
create policy financeiro_admin on public.clientes_financeiro for all to authenticated
  using ((select privado.eh_admin())) with check ((select privado.eh_admin()));
insert into public.clientes_financeiro (cliente_id, valor_mensal, dia_vencimento)
  select id, valor_mensal, dia_vencimento from public.clientes where valor_mensal is not null or dia_vencimento is not null;
alter table public.clientes drop column valor_mensal, drop column dia_vencimento;

-- 7. converter lead em cliente numa transação só (sem cliente duplicado se algo falhar)
create or replace function public.converter_lead(p_lead uuid) returns uuid
language plpgsql security invoker set search_path = public as $$
declare l public.leads; cid uuid;
begin
  select * into l from public.leads where id = p_lead for update;
  if not found then raise exception 'Lead não encontrado.'; end if;
  if l.cliente_id is not null then return l.cliente_id; end if;
  insert into public.clientes (nome, empresa, telefone, email, instagram, cidade, segmento, servicos, responsavel_id, inicio_contrato, observacoes)
  values (l.nome, l.empresa, l.telefone, l.email, l.instagram, l.cidade, l.segmento, l.servicos, l.responsavel_id, (now() at time zone 'America/Bahia')::date, l.observacoes)
  returning id into cid;
  if l.valor_estimado is not null and (select privado.eh_admin()) then
    insert into public.clientes_financeiro (cliente_id, valor_mensal) values (cid, l.valor_estimado);
  end if;
  update public.leads set cliente_id = cid,
    etapa_id = coalesce((select id from public.etapas where tipo = 'ganho' order by ordem limit 1), etapa_id)
  where id = p_lead;
  insert into public.atividades (lead_id, cliente_id, tipo, texto) values (p_lead, cid, 'sistema', 'Lead convertido em cliente');
  return cid;
end $$;
revoke execute on function public.converter_lead(uuid) from public, anon;
grant execute on function public.converter_lead(uuid) to authenticated;

-- 8. formulário do site: validação mais dura, só valores conhecidos, limite geral e por IP
create table privado.lead_ips (ip text not null, em timestamptz not null default now());
alter table privado.lead_ips enable row level security;
create index lead_ips_ip_em on privado.lead_ips (ip, em);
create index leads_site_criado on public.leads (criado_em) where origem = 'site';

create or replace function public.lead_do_site(p_nome text, p_telefone text, p_cidade text default null, p_servico text default null, p_mensagem text default null)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_tel text := regexp_replace(coalesce(p_telefone, ''), '\D', '', 'g');
  v_hdr json := nullif(current_setting('request.headers', true), '')::json;
  v_ip text := coalesce(nullif(v_hdr->>'cf-connecting-ip', ''), nullif(trim(split_part(v_hdr->>'x-forwarded-for', ',', 1)), ''), '');
begin
  if coalesce(length(trim(p_nome)), 0) < 2 or length(p_nome) > 120 or trim(p_nome) ~ '^[=+@-]' then raise exception 'nome inválido'; end if;
  if length(coalesce(p_telefone, '')) > 25 or coalesce(p_telefone, '') !~ '^\s*\+?[0-9 ().-]+\s*$' or length(v_tel) not between 10 and 13 then raise exception 'telefone inválido'; end if;
  if length(coalesce(p_mensagem, '')) > 1000 then raise exception 'texto longo demais'; end if;
  -- limite geral (robô que troca o número a cada envio) e por endereço
  if (select count(*) from public.leads where origem = 'site' and criado_em > now() - interval '10 minutes') >= 30 then
    raise exception 'muitos pedidos agora, tente mais tarde';
  end if;
  if v_ip <> '' then
    delete from privado.lead_ips where em < now() - interval '1 day';
    if (select count(*) from privado.lead_ips where ip = v_ip and em > now() - interval '1 hour') >= 5 then
      raise exception 'muitos pedidos agora, tente mais tarde';
    end if;
    insert into privado.lead_ips (ip) values (v_ip);
  end if;
  -- mesmo telefone só 1 vez a cada 10 min (reenvio do mesmo pedido)
  if exists (select 1 from public.leads where origem = 'site' and criado_em > now() - interval '10 minutes'
             and regexp_replace(telefone, '\D', '', 'g') = v_tel) then return; end if;
  insert into public.leads (nome, telefone, cidade, origem, servicos, observacoes)
  values (trim(p_nome), trim(p_telefone),
    case when trim(p_cidade) in ('Barreiras', 'Luís Eduardo Magalhães', 'São Desidério', 'Riachão das Neves', 'Formosa do Rio Preto',
      'Correntina', 'Santa Maria da Vitória', 'Bom Jesus da Lapa', 'Outra cidade') then trim(p_cidade) end,
    'site',
    case when p_servico in ('Tráfego pago', 'Social media', 'Site', 'SEO local / Google', 'Identidade visual', 'Audiovisual', 'Influência')
      then array[p_servico] else '{}' end,
    nullif(trim(p_mensagem), ''));
end $$;
