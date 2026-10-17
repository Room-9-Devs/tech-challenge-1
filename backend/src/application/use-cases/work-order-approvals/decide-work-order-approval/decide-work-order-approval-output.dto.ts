import { WorkOrderApprovalDecision } from '../work-order-approval-decision.enum';

export interface DecideWorkOrderApprovalOutputDto {
  orderNumber: string;
  decision: WorkOrderApprovalDecision;
}
