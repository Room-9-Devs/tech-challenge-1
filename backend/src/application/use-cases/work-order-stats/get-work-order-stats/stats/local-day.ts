/** Converte uma data YYYY-MM-DD no primeiro instante do dia (fuso do servidor). */
export function startOfLocalDay(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/** Converte uma data YYYY-MM-DD no último instante do dia (fuso do servidor). */
export function endOfLocalDay(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999);
}
