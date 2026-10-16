import {
  WorkOrderStat,
  WorkOrderStatsContext,
  isInPeriod,
} from './work-order-stat';

/**
 * Estatística de contagem de OS criadas dentro do período
 * (data de criação entre start e end).
 */
export const woStartedStat: WorkOrderStat = {
  tag: 'wo_started',
  name: 'Ordens de serviço iniciadas',
  hint: 'Quantidade de ordens de serviço criadas com data de criação dentro do período (entre o início e o fim, inclusive).',
  compute(context: WorkOrderStatsContext): string {
    const count = context.records.filter((record) =>
      isInPeriod(context, record.createdAt),
    ).length;
    return String(count);
  },
};
