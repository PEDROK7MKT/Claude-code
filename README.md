# 🦇 Batcaverna Ops

Central de operações single-page para agência de marketing digital, com estética
inspirada no universo do Batman: preto profundo (`#0A0A0F`), grafite (`#1A1D24`)
e azul neon (`#00D4FF`) com glow.

## Funcionalidades

- **Metas do dia** — defina metas diárias (leads abordados, respostas, reuniões…),
  marque o progresso com barras animadas, veja o % geral do dia no anel do topo,
  receba feedback visual (glow + toast) ao bater cada meta e reinicie com "Novo dia"
  (reset automático quando a data vira).
- **CRM de Prospecção** — cadastro de leads (empresa, segmento, WhatsApp, Instagram,
  tem site, cidade, observação) com **score automático ao vivo**: sem site + segmento
  de ticket alto = prioridade máxima. A lógica completa fica visível no painel
  "Lógica do score".
- **Funil Kanban** — colunas Novo → Abordado → Respondeu → Reunião → Fechado → Perdido,
  com drag-and-drop dos cards, contagem e % por coluna e taxa de fechamento nos tiles.
- **Radar** — todos os leads ranqueados por score, com o raio-X de quais regras
  pontuaram em cada um.
- Ícones SVG próprios com microinterações (glow, escala, rotação) e emblema-assinatura
  pulsando em loop no cabeçalho.
- Persistência em `localStorage` — sem backend.

## Rodando

```bash
npm install
npm run dev      # desenvolvimento em http://localhost:5173
npm run build    # build de produção em dist/
```

Stack: React 18 + Vite, CSS puro (sem frameworks de UI).
