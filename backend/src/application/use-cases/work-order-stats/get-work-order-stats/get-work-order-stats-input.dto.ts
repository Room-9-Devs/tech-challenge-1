import { StatsPeriod } from './resolve-stats-period';

export interface GetWorkOrderStatsInputDto {
  period?: StatsPeriod;
  startDate?: string | null;
  endDate?: string | null;
}
