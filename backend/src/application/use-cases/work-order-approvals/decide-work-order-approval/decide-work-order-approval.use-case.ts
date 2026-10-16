import { Inject, Injectable } from '@nestjs/common';
import {
  REFRESH_TOKEN_SERVICE,
  RefreshTokenService,
} from '@/application/ports/refresh-token-service.port';
import {
  WORK_ORDER_APPROVAL_TOKEN_REPOSITORY,
  WorkOrderApprovalTokenRepository,
} from '@/application/ports/work-order-approval-token.repository';
import { USER_REPOSITORY } from '@/application/use-cases/users/create-user/create-user.use-case';
import { ChangeWorkOrderStatusUseCase } from '@/application/use-cases/work-orders/change-work-order-status/change-work-order-status.use-case';
import { WorkOrderApprovalLinkInvalidError } from '@/domain/errors/work-order-approval-link-invalid.error';
import { UserRepository } from '@/domain/repositories/user.repository';
import {
  WORK_ORDER_REPOSITORY,
  WorkOrderRepository,
} from '@/domain/repositories/work-order.repository';
import { findPendingApproval } from '../find-pending-approval.helper';
import {
  WORK_ORDER_APPROVAL_DECISION_STATUS,
  WorkOrderApprovalDecision,
} from '../work-order-approval-decision.enum';
import { DecideWorkOrderApprovalInputDto } from './decide-work-order-approval-input.dto';
import { DecideWorkOrderApprovalOutputDto } from './decide-work-order-approval-output.dto';

const DEFAULT_NOTES: Record<WorkOrderApprovalDecision, string> = {
  [WorkOrderApprovalDecision.APPROVE]:
    'Orçamento aprovado pelo cliente via link do e-mail',
  [WorkOrderApprovalDecision.REJECT]:
    'Orçamento recusado pelo cliente via link do e-mail',
};

// O ator vem do token, nunca da requisição: o link só age em nome do cliente da OS.
@Injectable()
export class DecideWorkOrderApprovalUseCase {
  constructor(
    @Inject(WORK_ORDER_APPROVAL_TOKEN_REPOSITORY)
    private readonly approvalTokens: WorkOrderApprovalTokenRepository,
    @Inject(REFRESH_TOKEN_SERVICE)
    private readonly opaqueTokens: RefreshTokenService,
    @Inject(WORK_ORDER_REPOSITORY) private readonly orders: WorkOrderRepository,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    private readonly changeWorkOrderStatus: ChangeWorkOrderStatusUseCase,
  ) {}

  async execute(
    input: DecideWorkOrderApprovalInputDto,
  ): Promise<DecideWorkOrderApprovalOutputDto> {
    const { token, order } = await findPendingApproval(
      {
        approvalTokens: this.approvalTokens,
        opaqueTokens: this.opaqueTokens,
        orders: this.orders,
      },
      input.token,
    );

    const client = await this.users.findById(token.clientId);
    if (!client) throw new WorkOrderApprovalLinkInvalidError();

    const reason = input.reason?.trim();
    await this.changeWorkOrderStatus.execute({
      id: order.id,
      status: WORK_ORDER_APPROVAL_DECISION_STATUS[input.decision],
      note: reason
        ? `${DEFAULT_NOTES[input.decision]}: ${reason}`
        : DEFAULT_NOTES[input.decision],
      actor: { id: client.id, username: client.username, entityType: 'client' },
      approvalTokenId: token.id,
    });

    return { orderNumber: order.number, decision: input.decision };
  }
}
