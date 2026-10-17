import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import {
  WorkOrderStat,
  WorkOrderStatsContext,
  statusAt,
} from './work-order-stat';

/**
 * Cria uma estatística de snapshot: conta as OS cujo status no último
 * instante do período é o status informado.
 */
export function createStatusSnapshotStat(
  status: WorkOrderStatus,
  tag: string,
  name: string,
  hint: string,
): WorkOrderStat {
  return {
    tag,
    name,
    hint,
    compute(context: WorkOrderStatsContext): string {
      const count = context.records.filter(
        (record) => statusAt(record, context.endInstant) === status,
      ).length;
      return String(count);
    },
  };
}
