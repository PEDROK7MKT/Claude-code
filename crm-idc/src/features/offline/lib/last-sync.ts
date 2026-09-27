/**
 * Texto da "última sincronização" dos dados salvos (indicador offline do header).
 * Puro e testável: recebe o instante da última atualização e o "agora".
 */
import { formatDateTime, formatTime, toDateKey } from "@/lib/dates";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export interface LastSyncLabel {
  /** Curto, relativo: "agora há pouco", "há 5 min", "hoje às 14:32", "ontem às 09:10", "em 25/09/2026". */
  relative: string;
  /** Absoluto no fuso da clínica: "27/09/2026 14:32". */
  absolute: string;
}

/**
 * Descreve quando os dados foram sincronizados pela última vez.
 * `null` quando ainda não há nada salvo neste aparelho.
 */
export function describeLastSync(syncedAt: number | null | undefined, now: number): LastSyncLabel | null {
  if (syncedAt == null || !Number.isFinite(syncedAt) || syncedAt <= 0) return null;

  const absolute = formatDateTime(syncedAt);
  // relógio do aparelho atrasado em relação ao dado: trata como recente
  const diff = Math.max(0, now - syncedAt);

  let relative: string;
  if (diff < MINUTE) {
    relative = "agora há pouco";
  } else if (diff < HOUR) {
    relative = `há ${Math.floor(diff / MINUTE)} min`;
  } else if (toDateKey(syncedAt) === toDateKey(now)) {
    relative = `hoje às ${formatTime(syncedAt)}`;
  } else if (toDateKey(syncedAt) === toDateKey(now - DAY)) {
    relative = `ontem às ${formatTime(syncedAt)}`;
  } else {
    relative = `em ${absolute.slice(0, 10)}`;
  }

  return { relative, absolute };
}

/** Maior `dataUpdatedAt` entre as queries (0 = nenhuma com dados). */
export function latestUpdatedAt(timestamps: Iterable<number>): number {
  let latest = 0;
  for (const t of timestamps) if (Number.isFinite(t) && t > latest) latest = t;
  return latest;
}
