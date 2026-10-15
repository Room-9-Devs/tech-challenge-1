export const STATS_PERIODS = [
  'today',
  'week',
  'two-weeks',
  'month',
  'two-months',
  'three-months',
  'year',
  'month-start',
  'year-start',
  'all',
  'custom',
] as const;

export type StatsPeriod = (typeof STATS_PERIODS)[number];
export type ResolvedStatsPeriodName = StatsPeriod;

export interface ResolveStatsPeriodInput {
  period?: StatsPeriod;
  startDate?: string | null;
  endDate?: string | null;
}

export interface ResolvedStatsPeriod {
  period: ResolvedStatsPeriodName;
  startDate: string | null;
  endDate: string | null;
}

const MS_PER_DAY = 86_400_000;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Valida uma data no formato YYYY-MM-DD, incluindo checagem de data real
 * (ex.: 2026-02-30 é rejeitada).
 */
export const isValidIsoDate = (value: string): boolean => {
  if (!ISO_DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

/** Data de hoje (fuso do servidor) representada como Date em UTC. */
const startOfLocalDayUtc = (now: Date): Date =>
  new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

const formatIso = (date: Date): string => date.toISOString().slice(0, 10);

const addDays = (date: Date, days: number): Date =>
  new Date(date.getTime() + days * MS_PER_DAY);

/**
 * Soma meses limitando o dia ao último dia válido do mês de destino
 * (ex.: 31/03 - 1 mês = 28/02).
 */
const addMonthsClamped = (date: Date, months: number): Date => {
  const target = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1),
  );
  const lastDayOfMonth = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  return new Date(
    Date.UTC(
      target.getUTCFullYear(),
      target.getUTCMonth(),
      Math.min(date.getUTCDate(), lastDayOfMonth),
    ),
  );
};

/**
 * Resolve o período efetivo das estatísticas.
 *
 * - `startDate`/`endDate` têm prioridade sobre `period` (resultado: `custom`);
 * - sem datas, `period` (ou `all` por default) define o intervalo;
 * - `custom` sem `startDate`/`endDate` não tem intervalo a inferir e vira `all`;
 * - somente `startDate` implica `endDate` = hoje;
 * - somente `endDate` implica `startDate` = null (qualquer dia até o fim).
 */
export function resolveStatsPeriod(
  input: ResolveStatsPeriodInput = {},
  now: Date = new Date(),
): ResolvedStatsPeriod {
  const hasStart = Boolean(input.startDate);
  const hasEnd = Boolean(input.endDate);
  const today = startOfLocalDayUtc(now);

  if (hasStart || hasEnd) {
    return {
      period: 'custom',
      startDate: input.startDate ?? null,
      endDate: hasEnd ? (input.endDate as string) : formatIso(today),
    };
  }

  const period: StatsPeriod = input.period ?? 'all';
  const end = formatIso(today);

  switch (period) {
    case 'all':
      return { period, startDate: null, endDate: null };
    case 'today':
      return { period, startDate: end, endDate: end };
    case 'week':
      return { period, startDate: formatIso(addDays(today, -7)), endDate: end };
    case 'two-weeks':
      return {
        period,
        startDate: formatIso(addDays(today, -14)),
        endDate: end,
      };
    case 'month':
      return {
        period,
        startDate: formatIso(addMonthsClamped(today, -1)),
        endDate: end,
      };
    case 'two-months':
      return {
        period,
        startDate: formatIso(addMonthsClamped(today, -2)),
        endDate: end,
      };
    case 'three-months':
      return {
        period,
        startDate: formatIso(addMonthsClamped(today, -3)),
        endDate: end,
      };
    case 'year':
      return {
        period,
        startDate: formatIso(addMonthsClamped(today, -12)),
        endDate: end,
      };
    case 'month-start':
      return {
        period,
        startDate: formatIso(
          new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1)),
        ),
        endDate: end,
      };
    case 'year-start':
      return {
        period,
        startDate: formatIso(new Date(Date.UTC(today.getUTCFullYear(), 0, 1))),
        endDate: end,
      };
    case 'custom':
      // `custom` sem start/end não tem intervalo a inferir: equivale a `all`.
      return { period: 'all', startDate: null, endDate: null };
    default: {
      const exhaustive: never = period;
      throw new Error(`Período não suportado: ${exhaustive}`);
    }
  }
}
