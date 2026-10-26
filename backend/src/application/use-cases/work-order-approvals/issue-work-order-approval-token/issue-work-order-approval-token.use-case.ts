import { Inject, Injectable } from '@nestjs/common';
import {
  REFRESH_TOKEN_SERVICE,
  RefreshTokenService,
} from '@/application/ports/refresh-token-service.port';
import {
  WORK_ORDER_APPROVAL_TOKEN_REPOSITORY,
  WorkOrderApprovalTokenRepository,
} from '@/application/ports/work-order-approval-token.repository';
import { WorkOrder } from '@/domain/entities/work-order.entity';

export const WORK_ORDER_APPROVAL_TTL_HOURS = Symbol(
  'WORK_ORDER_APPROVAL_TTL_HOURS',
);

const HOUR_IN_MS = 60 * 60 * 1000;

// Gera o token enviado no e-mail de orçamento. Só o hash é persistido; o valor puro sai apenas no link.
@Injectable()
export class IssueWorkOrderApprovalTokenUseCase {
  constructor(
    @Inject(WORK_ORDER_APPROVAL_TOKEN_REPOSITORY)
    private readonly approvalTokens: WorkOrderApprovalTokenRepository,
    // Mesmo gerador opaco do refresh token: 48 bytes aleatórios + SHA-256.
    @Inject(REFRESH_TOKEN_SERVICE)
    private readonly opaqueTokens: RefreshTokenService,
    @Inject(WORK_ORDER_APPROVAL_TTL_HOURS) private readonly ttlHours: number,
  ) {}

  async execute(order: WorkOrder): Promise<string> {
    // Um reenvio do orçamento invalida os links anteriores.
    await this.approvalTokens.revokeAllByWorkOrder(order.id);

    const token = this.opaqueTokens.generate();
    await this.approvalTokens.save({
      workOrderId: order.id,
      clientId: order.clientId,
      tokenHash: this.opaqueTokens.hash(token),
      expiresAt: new Date(Date.now() + this.ttlHours * HOUR_IN_MS),
    });
    return token;
  }
}
