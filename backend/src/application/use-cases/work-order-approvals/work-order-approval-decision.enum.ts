import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';

export enum WorkOrderApprovalDecision {
  APPROVE = 'approve',
  REJECT = 'reject',
}

export const WORK_ORDER_APPROVAL_DECISION_STATUS: Record<
  WorkOrderApprovalDecision,
  WorkOrderStatus.APPROVED | WorkOrderStatus.CANCELLED
> = {
  [WorkOrderApprovalDecision.APPROVE]: WorkOrderStatus.APPROVED,
  [WorkOrderApprovalDecision.REJECT]: WorkOrderStatus.CANCELLED,
};

export function isWorkOrderApprovalDecision(
  value: string,
): value is WorkOrderApprovalDecision {
  return Object.values(WorkOrderApprovalDecision).includes(
    value as WorkOrderApprovalDecision,
  );
}
