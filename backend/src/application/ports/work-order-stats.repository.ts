import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';

export const WORK_ORDER_STATS_REPOSITORY = Symbol(
  'WORK_ORDER_STATS_REPOSITORY',
);

export interface WorkOrderStatusTransition {
  status: WorkOrderStatus;
  at: Date;
}

export interface WorkOrderStatsRecord {
  id: string;
  createdAt: Date;
  /** Transições de status ocorridas até o instante consultado, em ordem cronológica. */
  transitions: WorkOrderStatusTransition[];
}

export interface WorkOrderStatsRepository {
  /**
   * Carrega as ordens de serviço criadas até `until` (inclusive), incluindo
   * somente as transições de status ocorridas até `until`, permitindo
   * reconstruir o estado de cada OS no último instante do período.
   */
  findRecordsCreatedUntil(until: Date): Promise<WorkOrderStatsRecord[]>;

  /**
   * Carrega uma única ordem de serviço por id com todas as suas transições
   * de status em ordem cronológica, para o cálculo das estatísticas
   * individuais da OS.
   */
  findRecordById(id: string): Promise<WorkOrderStatsRecord | null>;
}
