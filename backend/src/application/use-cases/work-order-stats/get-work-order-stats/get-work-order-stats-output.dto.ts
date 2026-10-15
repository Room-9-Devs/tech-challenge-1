import { ResolvedStatsPeriodName } from './resolve-stats-period';

export interface GetWorkOrderStatsOutputDto {
  period: ResolvedStatsPeriodName;
  start_date: string | null;
  end_date: string | null;
  stats: Record<string, never>;
}
