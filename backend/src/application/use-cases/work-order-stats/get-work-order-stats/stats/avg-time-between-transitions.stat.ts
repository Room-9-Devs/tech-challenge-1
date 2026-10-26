import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import { formatDuration } from './format-duration';
import {
  WorkOrderStat,
  WorkOrderStatsContext,
  firstEnteredAt,
  isInPeriod,
} from './work-order-stat';

/**
 * Cria uma estatística de tempo médio entre duas transições de status.
 *
 * A média considera apenas ordens que tiveram ambas as transições e cuja
 * transição de destino (`to`) ocorreu dentro do período. Para `from =
 * 'received'`, considera a criação da OS (`createdAt`) como marco inicial.
 *
 * Se nenhuma OS se enquadrar, retorna "sem dados".
 */
export function createAvgTimeBetweenTransitionsStat(
  from: WorkOrderStatus | 'received',
  to: WorkOrderStatus,
  tag: string,
  name: string,
  hint: string,
): WorkOrderStat {
  return {
    tag,
    name,
    hint,
    compute(context: WorkOrderStatsContext): string {
      const durations: number[] = [];
      for (const record of context.records) {
        const startedAt =
          from === 'received' ? record.createdAt : firstEnteredAt(record, from);
        if (startedAt === null) continue;

        const endedAt = firstEnteredAt(record, to);
        if (endedAt === null) continue;

        // A transição de destino deve ocorrer dentro do período.
        if (!isInPeriod(context, endedAt)) continue;

        durations.push(endedAt.getTime() - startedAt.getTime());
      }
      if (durations.length === 0) return 'sem dados';
      const total = durations.reduce((sum, ms) => sum + ms, 0);
      return formatDuration(total / durations.length);
    },
  };
}
