import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import { WorkOrderStatsRecord } from '@/application/ports/work-order-stats.repository';

export interface WorkOrderStatsContext {
  /** Início do período (null = sem limite inferior). */
  startInstant: Date | null;
  /** Último instante do período, usado como snapshot de status (fim do dia ou agora). */
  endInstant: Date;
  /** Ordens de serviço criadas até `endInstant`, com transições até o mesmo instante. */
  records: WorkOrderStatsRecord[];
}

export interface WorkOrderStat {
  tag: string;
  name: string;
  hint: string;
  compute(context: WorkOrderStatsContext): string;
}

export function isInPeriod(
  context: WorkOrderStatsContext,
  date: Date,
): boolean {
  return (
    (!context.startInstant || date >= context.startInstant) &&
    date <= context.endInstant
  );
}

/**
 * Status da OS reconstruído no instante informado: a última transição até o
 * instante define o status; sem transições, a OS estava em `received`
 * (status inicial por criação).
 */
export function statusAt(
  record: WorkOrderStatsRecord,
  instant: Date,
): WorkOrderStatus {
  let current: WorkOrderStatus = WorkOrderStatus.RECEIVED;
  for (const transition of record.transitions) {
    if (transition.at > instant) break;
    current = transition.status;
  }
  return current;
}

/** Instante da primeira transição para o status informado, se houver. */
export function firstEnteredAt(
  record: WorkOrderStatsRecord,
  status: WorkOrderStatus,
): Date | null {
  const transition = record.transitions.find((t) => t.status === status);
  return transition ? transition.at : null;
}
