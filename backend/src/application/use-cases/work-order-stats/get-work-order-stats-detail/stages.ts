import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import {
  WorkOrderStatsRecord,
} from '@/application/ports/work-order-stats.repository';
import { formatDuration } from '../get-work-order-stats/stats/format-duration';
import { firstEnteredAt, statusAt } from '../get-work-order-stats/stats/work-order-stat';

/** Valor global correspondente a uma etapa, para o comparativo OS × oficina. */
export interface WorkOrderStageGlobalValue {
  tag: string;
  value: string;
}

/** Estatísticas globais indexadas por tag (saída de GET /stats). */
export type GlobalStatsIndex = Record<string, { value: string }>;

/** Definição declarativa de uma etapa do ciclo de vida da OS. */
export interface WorkOrderStageDefinition {
  /** Status de entrada que encerra a etapa. */
  to: WorkOrderStatus;
  name: string;
  hint: string;
  /** Tag da estatística global correspondente; null quando não há par. */
  globalTag: string | null;
}

/**
 * Etapas do ciclo de vida da OS, na ordem do fluxo. A etapa `i` inicia no
 * marco de destino da etapa anterior (a primeira inicia na criação da OS) e
 * termina quando a OS entra em `to` — espeilhando os pares das médias
 * globais (`avg_time_from_*`), o que mantém o comparativo semântico.
 */
export const WORK_ORDER_STAGES: WorkOrderStageDefinition[] = [
  {
    to: WorkOrderStatus.UNDER_DIAGNOSIS,
    name: 'Fila para diagnóstico',
    hint: 'Tempo entre a abertura da ordem de serviço e o início do diagnóstico.',
    globalTag: 'avg_time_from_received_to_under_diagnosis',
  },
  {
    to: WorkOrderStatus.AWAITING_APPROVAL,
    name: 'Tempo de diagnóstico',
    hint: 'Tempo entre o início do diagnóstico e o envio do orçamento ao cliente.',
    globalTag: 'avg_time_from_under_diagnosis_to_awaiting_approval',
  },
  {
    to: WorkOrderStatus.APPROVED,
    name: 'Aguardando aprovação',
    hint: 'Tempo entre o envio do orçamento e a decisão do cliente (aprovação).',
    globalTag: 'avg_time_from_awaiting_approval_to_approved',
  },
  {
    to: WorkOrderStatus.IN_PROGRESS,
    name: 'Fila para execução',
    hint: 'Tempo entre a aprovação do orçamento e o início da execução. Considera a confirmação de pagamento.',
    globalTag: 'avg_time_from_approved_to_in_progress',
  },
  {
    to: WorkOrderStatus.COMPLETED,
    name: 'Execução do serviço',
    hint: 'Tempo entre o início da execução e a conclusão do serviço.',
    globalTag: 'avg_time_from_in_progress_to_completed',
  },
  {
    to: WorkOrderStatus.DELIVERED,
    name: 'Fila para entrega',
    hint: 'Tempo entre a conclusão do serviço e a entrega do veículo ao cliente.',
    globalTag: null,
  },
];

export interface WorkOrderStageView {
  /** Status de destino da etapa. */
  tag: WorkOrderStatus;
  name: string;
  hint: string;
  startedAt: Date | null;
  endedAt: Date | null;
  /** Duração fechada (marco inicial e final existentes). */
  duration: string | null;
  /** Duração em curso: etapa iniciada, encerramento ainda não ocorreu e a OS não está em estado terminal. */
  pendingDuration: string | null;
  /** Estatística global correspondente, para comparação com a etapa da OS. */
  global: WorkOrderStageGlobalValue | null;
}

export interface WorkOrderTotalView {
  name: string;
  hint: string;
  /** Duração fechada: da criação da OS até a conclusão. */
  duration: string | null;
  /** Duração em curso: OS aberta e ainda não concluída (não cancelada). */
  pendingDuration: string | null;
  global: WorkOrderStageGlobalValue;
}

export interface WorkOrderCurrentStatusView {
  status: WorkOrderStatus;
  since: Date;
  duration: string;
}

const isTerminalStatus = (status: WorkOrderStatus): boolean =>
  status === WorkOrderStatus.DELIVERED || status === WorkOrderStatus.CANCELLED;

const stageStart = (
  record: WorkOrderStatsRecord,
  index: number,
): Date | null =>
  index === 0
    ? record.createdAt
    : firstEnteredAt(record, WORK_ORDER_STAGES[index - 1].to);

/** Constrói a visão de cada etapa do ciclo de vida de uma única OS. */
export function buildWorkOrderStages(
  record: WorkOrderStatsRecord,
  globalStats: GlobalStatsIndex,
  now: Date,
): WorkOrderStageView[] {
  const terminal = isTerminalStatus(statusAt(record, now));

  return WORK_ORDER_STAGES.map((definition, index) => {
    const startedAt = stageStart(record, index);
    const endedAt = firstEnteredAt(record, definition.to);

    const duration =
      startedAt && endedAt ? formatDuration(endedAt.getTime() - startedAt.getTime()) : null;
    const pendingDuration =
      startedAt && !endedAt && !terminal
        ? formatDuration(now.getTime() - startedAt.getTime())
        : null;

    const global = definition.globalTag
      ? { tag: definition.globalTag, value: globalStats[definition.globalTag]?.value ?? null }
      : null;

    return {
      tag: definition.to,
      name: definition.name,
      hint: definition.hint,
      startedAt,
      endedAt,
      duration,
      pendingDuration,
      global,
    };
  });
}

/** Tempo total: da criação da OS até a conclusão (ou em curso). */
export function buildWorkOrderTotal(
  record: WorkOrderStatsRecord,
  globalStats: GlobalStatsIndex,
  now: Date,
): WorkOrderTotalView {
  const completedAt = firstEnteredAt(record, WorkOrderStatus.COMPLETED);
  const terminal = isTerminalStatus(statusAt(record, now));

  return {
    name: 'Tempo total da ordem de serviço',
    hint: 'Tempo entre a abertura da ordem de serviço e a conclusão do serviço.',
    duration: completedAt
      ? formatDuration(completedAt.getTime() - record.createdAt.getTime())
      : null,
    pendingDuration:
      !completedAt && !terminal
        ? formatDuration(now.getTime() - record.createdAt.getTime())
        : null,
    global: {
      tag: 'avg_time_from_received',
      value: globalStats['avg_time_from_received']?.value ?? null,
    },
  };
}

/** Status atual da OS e há quanto tempo ela está nele. */
export function buildWorkOrderCurrentStatus(
  record: WorkOrderStatsRecord,
  now: Date,
): WorkOrderCurrentStatusView {
  const status = statusAt(record, now);

  let since = record.createdAt;
  for (const transition of record.transitions) {
    if (transition.at > now) break;
    since = transition.at;
  }

  return { status, since, duration: formatDuration(now.getTime() - since.getTime()) };
}
