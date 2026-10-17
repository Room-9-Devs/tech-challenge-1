import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import { WorkOrderStat } from './work-order-stat';
import { woStartedStat } from './wo-started.stat';
import { woCompletedStat } from './wo-completed.stat';
import { createStatusSnapshotStat } from './status-snapshot.stat';
import { createAvgCompletionTimeStat } from './avg-completion-time.stat';
import { createAvgTimeBetweenTransitionsStat } from './avg-time-between-transitions.stat';

/**
 * Registro das estatísticas retornadas em `stats`.
 *
 * Para adicionar ou remover uma estatística, basta inserir ou remover sua
 * entrada aqui — nenhuma outra peça precisa ser remodelada.
 */
export const WORK_ORDER_STATS: WorkOrderStat[] = [
  woStartedStat,
  woCompletedStat,
  createStatusSnapshotStat(
    WorkOrderStatus.DELIVERED,
    'wo_delivered',
    'Veículos entregues',
    'Quantidade de ordens de serviço que estavam com o veículo entregue ao cliente ao fim do período.',
  ),
  createStatusSnapshotStat(
    WorkOrderStatus.CANCELLED,
    'wo_cancelled',
    'Ordens de serviço canceladas',
    'Quantidade de ordens de serviço canceladas ao fim do período.',
  ),
  createStatusSnapshotStat(
    WorkOrderStatus.APPROVED,
    'wo_approved',
    'Orçamentos aprovados em execução',
    'Quantidade de ordens de serviço com orçamento aprovado e serviço ainda não concluído ao fim do período.',
  ),
  createStatusSnapshotStat(
    WorkOrderStatus.UNDER_DIAGNOSIS,
    'wo_under_diagnosis',
    'Ordens de serviço em diagnóstico',
    'Quantidade de ordens de serviço em diagnóstico ao fim do período.',
  ),
  createStatusSnapshotStat(
    WorkOrderStatus.AWAITING_APPROVAL,
    'wo_awaiting_approval',
    'Ordens de serviço aguardando aprovação',
    'Quantidade de ordens de serviço com orçamento aguardando aprovação do cliente ao fim do período.',
  ),
  createStatusSnapshotStat(
    WorkOrderStatus.IN_PROGRESS,
    'wo_in_progress',
    'Ordens de serviço em execução',
    'Quantidade de ordens de serviço com serviço em execução ao fim do período.',
  ),
  createAvgTimeBetweenTransitionsStat(
    'received',
    WorkOrderStatus.UNDER_DIAGNOSIS,
    'avg_time_from_received_to_under_diagnosis',
    'Tempo médio na fila para diagnóstico',
    'Média entre o recebimento da ordem de serviço e o início do diagnóstico. Considera apenas ordens que iniciaram o diagnóstico dentro do período.',
  ),
  createAvgTimeBetweenTransitionsStat(
    WorkOrderStatus.UNDER_DIAGNOSIS,
    WorkOrderStatus.AWAITING_APPROVAL,
    'avg_time_from_under_diagnosis_to_awaiting_approval',
    'Tempo médio de diagnóstico',
    'Média entre o início do diagnóstico e a entrada em aguardo de aprovação. Considera apenas ordens que passaram para aguardo de aprovação dentro do período.',
  ),
  createAvgTimeBetweenTransitionsStat(
    WorkOrderStatus.AWAITING_APPROVAL,
    WorkOrderStatus.APPROVED,
    'avg_time_from_awaiting_approval_to_approved',
    'Tempo médio de aguardo de aprovação',
    'Média entre a entrada em aguardo de aprovação e a aprovação do cliente. Considera apenas ordens aprovadas dentro do período.',
  ),
  createAvgTimeBetweenTransitionsStat(
    WorkOrderStatus.APPROVED,
    WorkOrderStatus.IN_PROGRESS,
    'avg_time_from_approved_to_in_progress',
    'Tempo médio na fila para execução',
    'Média entre a aprovação do cliente e o início da execução do serviço. Considera apenas ordens que iniciaram a execução dentro do período.',
  ),
  createAvgTimeBetweenTransitionsStat(
    WorkOrderStatus.IN_PROGRESS,
    WorkOrderStatus.COMPLETED,
    'avg_time_from_in_progress_to_completed',
    'Tempo médio de conclusão do serviço',
    'Média entre o início da execução do serviço e a conclusão. Considera apenas ordens concluídas dentro do período.',
  ),
  createAvgCompletionTimeStat(
    'received',
    'avg_time_from_received',
    'Tempo médio de conclusão desde o recebimento',
    'Média entre a criação da ordem de serviço e a conclusão das ordens concluídas no período.',
  ),
  createAvgCompletionTimeStat(
    WorkOrderStatus.UNDER_DIAGNOSIS,
    'avg_time_from_diagnosis',
    'Tempo médio de conclusão desde o início do diagnóstico',
    'Média entre o início do diagnóstico e a conclusão das ordens concluídas no período. Ordens sem diagnóstico registrado são ignoradas.',
  ),
  createAvgCompletionTimeStat(
    WorkOrderStatus.AWAITING_APPROVAL,
    'avg_time_from_awaiting_approval',
    'Tempo médio de conclusão desde o aguardo de aprovação',
    'Média entre a entrada em aguardo de aprovação e a conclusão das ordens concluídas no período. Ordens sem aguardo de aprovação registrado são ignoradas.',
  ),
  createAvgCompletionTimeStat(
    WorkOrderStatus.APPROVED,
    'avg_time_from_approved',
    'Tempo médio de conclusão desde a aprovação do cliente',
    'Média entre a aprovação do cliente e a conclusão das ordens concluídas no período. Ordens sem aprovação registrada são ignoradas.',
  ),
];
