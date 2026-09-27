/* =====================================================================
   CONFIGURAÇÃO · tudo que a equipe Valora precisa editar fica aqui
   Itens marcados com  ⚠ CONFIRMAR  dependem de decisão da marca.
   ===================================================================== */

export const CONFIG = {
  // ⚠ CONFIRMAR · data e hora da abertura, SEMPRE com o fuso de Brasília (-03:00).
  // A contagem é a mesma em qualquer aparelho e em qualquer fuso.
  // Se mudar a data, atualize também o texto do index.html (<time>, <title> e og:*).
  launchISO: '2026-10-10T20:00:00-03:00',
  launchDurationMin: 60, // duração do evento salvo na agenda

  // ⚠ CONFIRMAR · para onde "Conhecer as peças" leva depois da abertura
  shopURL: 'https://www.instagram.com/valorasuisse/',

  // ⚠ CONFIRMAR · Instagram do rodapé (sem @)
  instagram: 'valorasuisse',

  // ⚠ CONFIRMAR · WhatsApp da marca, só números com DDI (ex.: '5511999999999').
  // Com o número preenchido, a confirmação mostra "Confirmar pelo WhatsApp":
  // a pessoa manda a primeira mensagem, o que permite à marca salvar o contato.
  // Pelo app WhatsApp Business, listas de transmissão SÓ chegam a quem salvou
  // o número da marca; para disparar para toda a lista, use a API oficial
  // (WhatsApp Business Platform) com um modelo de mensagem aprovado.
  whatsappBrand: '',

  // ------------------------------------------------------------------
  // LISTA DE ESPERA · onde plugar o backend
  // Vazio = envio SIMULADO (bom para testar a página).
  // Para produção, cole a URL de um webhook que aceite POST:
  //   n8n    → nó "Webhook" (POST), em Options → Allowed Origins (CORS): *
  //   Zapier → "Webhooks by Zapier · Catch Hook"
  //   Make   → "Custom webhook"
  // O envio é application/x-www-form-urlencoded (não dispara preflight de CORS).
  // Os campos enviados estão documentados em js/main.js → submitLead().
  // ------------------------------------------------------------------
  waitlistEndpoint: '',

  // Eventos de medição (opcional). Se preenchido, cada evento vai por
  // navigator.sendBeacon como JSON. Também são empurrados em window.dataLayer
  // quando existir (Google Tag Manager).
  analyticsEndpoint: '',

  // Versão do texto de consentimento: vai junto com cada cadastro (prova do aceite).
  consentVersion: '2026-09-27',

  // Pedras · textos exatos do brief. `piece` e `pieceConfirmed`:
  // ⚠ CONFIRMAR qual pedra está em cada foto. Enquanto `pieceConfirmed` for
  // false, a legenda mostra só "Imagem ilustrativa."
  stones: {
    zirconia: { name: 'Zircônia', piece: 'Pulseira riviera', pieceConfirmed: false },
    moissanite: { name: 'Moissanite', piece: 'Anel solitário', pieceConfirmed: false },
  },
};
