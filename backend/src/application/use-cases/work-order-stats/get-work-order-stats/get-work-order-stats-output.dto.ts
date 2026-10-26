import { ResolvedStatsPeriodName } from './resolve-stats-period';

export interface WorkOrderStatEntry {
  name: string;
  value: string;
  hint: string;
}

export interface GetWorkOrderStatsOutputDto {
  period: ResolvedStatsPeriodName;
  start_date: string | null;
  end_date: string | null;
  stats: Record<string, WorkOrderStatEntry>;
}
