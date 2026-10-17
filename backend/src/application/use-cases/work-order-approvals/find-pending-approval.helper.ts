import { RefreshTokenService } from '@/application/ports/refresh-token-service.port';
import {
  WorkOrderApprovalTokenRecord,
  WorkOrderApprovalTokenRepository,
} from '@/application/ports/work-order-approval-token.repository';
import { WorkOrder } from '@/domain/entities/work-order.entity';
import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import { WorkOrderApprovalLinkInvalidError } from '@/domain/errors/work-order-approval-link-invalid.error';
import { WorkOrderRepository } from '@/domain/repositories/work-order.repository';

export interface PendingApproval {
  token: WorkOrderApprovalTokenRecord;
  order: WorkOrder;
}

// Todo motivo de recusa vira o mesmo erro: quem tenta adivinhar links não aprende nada com a resposta.
export async function findPendingApproval(
  dependencies: {
    approvalTokens: WorkOrderApprovalTokenRepository;
    opaqueTokens: RefreshTokenService;
    orders: WorkOrderRepository;
  },
  rawToken: string,
): Promise<PendingApproval> {
  if (!rawToken) throw new WorkOrderApprovalLinkInvalidError();

  const token = await dependencies.approvalTokens.findValidByHash(
    dependencies.opaqueTokens.hash(rawToken),
  );
  if (!token) throw new WorkOrderApprovalLinkInvalidError();

  const order = await dependencies.orders.findById(token.workOrderId);
  if (
    !order ||
    order.clientId !== token.clientId ||
    order.status !== WorkOrderStatus.AWAITING_APPROVAL
  ) {
    throw new WorkOrderApprovalLinkInvalidError();
  }

  return { token, order };
}
