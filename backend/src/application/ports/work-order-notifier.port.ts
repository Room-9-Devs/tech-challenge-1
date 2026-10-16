import { WorkOrder } from '@/domain/entities/work-order.entity';

export const WORK_ORDER_NOTIFIER = Symbol('WORK_ORDER_NOTIFIER');

// Envio best-effort: falhas são registradas em log e nunca interrompem o fluxo de quem chama.
export interface WorkOrderNotifier {
  // Sem token, o e-mail sai sem os links de aprovação e orienta o cliente a usar o sistema.
  notifyAwaitingApproval(
    order: WorkOrder,
    approvalToken?: string,
  ): Promise<void>;
  notifyCompleted(order: WorkOrder): Promise<void>;
}
