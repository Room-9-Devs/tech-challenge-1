import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import {
  WorkOrderStat,
  WorkOrderStatsContext,
  firstEnteredAt,
  isInPeriod,
} from './work-order-stat';

/**
 * Estatística de contagem de OS concluídas dentro do período
 * (transição para COMPLETED com data entre start e end).
 */
export const woCompletedStat: WorkOrderStat = {
  tag: 'wo_completed',
  name: 'Ordens de serviço concluídas',
  hint: 'Quantidade de ordens de serviço concluídas com data de conclusão dentro do período.',
  compute(context: WorkOrderStatsContext): string {
    const count = context.records.filter((record) => {
      const completedAt = firstEnteredAt(record, WorkOrderStatus.COMPLETED);
      return completedAt !== null && isInPeriod(context, completedAt);
    }).length;
    return String(count);
  },
};
