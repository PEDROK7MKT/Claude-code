/**
 * Aviso de logout entre abas (BroadcastChannel). Ao clicar em "Sair" numa aba, as outras
 * abas do CRM precisam apagar o próprio cache em memória — senão o persister o grava de
 * volta no IndexedDB no próximo refetch — e voltar ao login.
 */
export const AUTH_CHANNEL_NAME = "idc-auth";
export const SIGN_OUT_MESSAGE = "signout";

let channel: BroadcastChannel | null | undefined;

/**
 * Um único canal por aba, usado para enviar e para ouvir: o BroadcastChannel não entrega a
 * mensagem ao objeto que a enviou, então a aba que saiu não reage ao próprio aviso.
 */
function getChannel(): BroadcastChannel | null {
  if (channel === undefined) {
    try {
      channel = typeof BroadcastChannel === "function" ? new BroadcastChannel(AUTH_CHANNEL_NAME) : null;
    } catch {
      channel = null;
    }
  }
  return channel;
}

/** Avisa as outras abas abertas que a sessão foi encerrada. Nunca lança. */
export function broadcastSignOut(): void {
  try {
    getChannel()?.postMessage(SIGN_OUT_MESSAGE);
  } catch {
    // canal indisponível: as outras abas perdem a sessão no próximo acesso ao servidor
  }
}

/** Chama `onSignOut` quando outra aba avisar do logout. Retorna a função que cancela. */
export function subscribeToSignOut(onSignOut: () => void): () => void {
  const current = getChannel();
  if (!current) return () => undefined;
  const handleMessage = (event: MessageEvent) => {
    if (event.data === SIGN_OUT_MESSAGE) onSignOut();
  };
  current.addEventListener("message", handleMessage);
  return () => current.removeEventListener("message", handleMessage);
}
