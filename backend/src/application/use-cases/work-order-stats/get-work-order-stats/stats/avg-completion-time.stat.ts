import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import { formatDuration } from './format-duration';
import {
  WorkOrderStat,
  WorkOrderStatsContext,
  firstEnteredAt,
  isInPeriod,
} from './work-order-stat';

/** Marco inicial do cálculo do tempo de conclusão. */
export type CompletionMilestone = 'received' | WorkOrderStatus;

/**
 * Cria uma estatística de tempo médio de conclusão: média entre o marco
 * informado e a conclusão ('completed') das OS concluídas dentro do período.
 * OS sem o marco ou sem conclusão no período são ignoradas.
 */
export function createAvgCompletionTimeStat(
  milestone: CompletionMilestone,
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
        const completedAt = firstEnteredAt(record, WorkOrderStatus.COMPLETED);
        if (completedAt === null || !isInPeriod(context, completedAt)) {
          continue;
        }
        const startedAt =
          milestone === 'received'
            ? record.createdAt
            : firstEnteredAt(record, milestone);
        if (startedAt === null) continue;
        durations.push(completedAt.getTime() - startedAt.getTime());
      }
      if (durations.length === 0) return formatDuration(0);
      const total = durations.reduce((sum, ms) => sum + ms, 0);
      return formatDuration(total / durations.length);
    },
  };
}
