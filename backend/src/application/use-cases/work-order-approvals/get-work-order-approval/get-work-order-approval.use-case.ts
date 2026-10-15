import { Inject, Injectable } from '@nestjs/common';
import {
  REFRESH_TOKEN_SERVICE,
  RefreshTokenService,
} from '@/application/ports/refresh-token-service.port';
import {
  WORK_ORDER_APPROVAL_TOKEN_REPOSITORY,
  WorkOrderApprovalTokenRepository,
} from '@/application/ports/work-order-approval-token.repository';
import { WorkOrderQuoteService } from '@/application/services/work-order-quote.service';
import { WorkOrderApprovalLinkInvalidError } from '@/domain/errors/work-order-approval-link-invalid.error';
import {
  WORK_ORDER_REPOSITORY,
  WorkOrderRepository,
} from '@/domain/repositories/work-order.repository';
import { findPendingApproval } from '../find-pending-approval.helper';
import { GetWorkOrderApprovalOutputDto } from './get-work-order-approval-output.dto';

// Só leitura: abrir o link (inclusive por robôs de antivírus) nunca altera a OS.
@Injectable()
export class GetWorkOrderApprovalUseCase {
  constructor(
    @Inject(WORK_ORDER_APPROVAL_TOKEN_REPOSITORY)
    private readonly approvalTokens: WorkOrderApprovalTokenRepository,
    @Inject(REFRESH_TOKEN_SERVICE)
    private readonly opaqueTokens: RefreshTokenService,
    @Inject(WORK_ORDER_REPOSITORY) private readonly orders: WorkOrderRepository,
    private readonly quotes: WorkOrderQuoteService,
  ) {}

  async execute(rawToken: string): Promise<GetWorkOrderApprovalOutputDto> {
    const { order } = await findPendingApproval(
      {
        approvalTokens: this.approvalTokens,
        opaqueTokens: this.opaqueTokens,
        orders: this.orders,
      },
      rawToken,
    );

    const quote = await this.quotes.buildQuote(order);
    if (!quote) throw new WorkOrderApprovalLinkInvalidError();

    return {
      customerName: quote.customerName,
      vehicle: quote.vehicle,
      orderNumber: quote.orderNumber,
      items: quote.items,
      total: quote.total,
      generatedAt: quote.generatedAt,
    };
  }
}
