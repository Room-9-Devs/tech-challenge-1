import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  EMAIL_SENDER,
  EmailSender,
} from '@/application/ports/email-sender.port';
import { WorkOrderNotifier } from '@/application/ports/work-order-notifier.port';
import {
  WorkOrderQuoteService,
  WorkOrderRecipient,
} from '@/application/services/work-order-quote.service';
import { WorkOrder } from '@/domain/entities/work-order.entity';
import { RenderedEmail } from './templates/email-layout';
import { renderWorkOrderAwaitingApprovalEmail } from './templates/work-order-awaiting-approval.template';
import { renderWorkOrderCompletedEmail } from './templates/work-order-completed.template';

@Injectable()
export class EmailWorkOrderNotifier implements WorkOrderNotifier {
  private readonly logger = new Logger(EmailWorkOrderNotifier.name);
  private readonly publicUrl: string;

  constructor(
    @Inject(EMAIL_SENDER) private readonly emailSender: EmailSender,
    private readonly quotes: WorkOrderQuoteService,
    configService: ConfigService,
  ) {
    const port = configService.get<string>('PORT') || '3000';
    this.publicUrl = (
      configService.get<string>('APP_PUBLIC_URL') || `http://localhost:${port}`
    ).replace(/\/+$/, '');
  }

  async notifyAwaitingApproval(
    order: WorkOrder,
    approvalToken?: string,
  ): Promise<void> {
    await this.notify(order, async () => {
      const quote = await this.quotes.buildQuote(order);
      if (!quote) return null;

      return {
        recipient: quote,
        content: renderWorkOrderAwaitingApprovalEmail({
          customerName: quote.customerName,
          vehicle: quote.vehicle,
          orderNumber: quote.orderNumber,
          items: quote.items,
          total: quote.total,
          generatedAt: quote.generatedAt,
          ...(approvalToken && this.approvalUrls(approvalToken)),
        }),
      };
    });
  }

  async notifyCompleted(order: WorkOrder): Promise<void> {
    await this.notify(order, async () => {
      const recipient = await this.quotes.findRecipient(order);
      if (!recipient) return null;

      return {
        recipient,
        content: renderWorkOrderCompletedEmail({
          customerName: recipient.customerName,
          vehicle: recipient.vehicle,
          orderNumber: order.number,
          completedAt: order.updatedAt,
        }),
      };
    });
  }

  private approvalUrls(token: string): {
    approveUrl: string;
    rejectUrl: string;
  } {
    const base = `${this.publicUrl}/work-order-approvals/${encodeURIComponent(token)}`;
    return { approveUrl: `${base}/approve`, rejectUrl: `${base}/reject` };
  }

  // O status já foi gravado quando a notificação roda: qualquer falha aqui só pode ser registrada.
  private async notify(
    order: WorkOrder,
    render: () => Promise<{
      recipient: WorkOrderRecipient;
      content: RenderedEmail;
    } | null>,
  ): Promise<void> {
    try {
      const email = await render();
      if (!email) {
        this.logger.warn(
          `Cliente da ${order.number} não encontrado. E-mail não enviado.`,
        );
        return;
      }

      await this.emailSender.send({
        to: email.recipient.email,
        ...email.content,
      });
    } catch (error) {
      const failure = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Falha ao notificar o cliente da ${order.number}: ${failure.message}`,
        failure.stack,
      );
    }
  }
}
