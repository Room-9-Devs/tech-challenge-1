import { WorkOrderApprovalDecision } from '../work-order-approval-decision.enum';

export interface DecideWorkOrderApprovalInputDto {
  token: string;
  decision: WorkOrderApprovalDecision;
  reason?: string;
}
