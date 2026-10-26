const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * Formata uma duração em milissegundos como "3d 13h 20m".
 * Valores negativos são tratados como zero.
 */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / MINUTE_MS));
  const days = Math.floor(total / (DAY_MS / MINUTE_MS));
  const hours = Math.floor((total % (DAY_MS / MINUTE_MS)) / 60);
  const minutes = total % 60;
  return `${days}d ${hours}h ${minutes}m`;
}
