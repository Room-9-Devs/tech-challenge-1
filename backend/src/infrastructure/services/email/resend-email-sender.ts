import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import {
  EmailSender,
  SendEmailInput,
} from '@/application/ports/email-sender.port';

@Injectable()
export class ResendEmailSender implements EmailSender {
  private readonly logger = new Logger(ResendEmailSender.name);
  private readonly client: Resend | null;
  private readonly from: string;
  private readonly redirectTo: string[];

  constructor(configService: ConfigService) {
    const apiKey = configService.get<string>('RESEND_API_KEY');

    this.from = configService.get<string>('EMAIL_FROM');
    this.client = apiKey ? new Resend(apiKey) : null;
    this.redirectTo = (configService.get<string>('EMAIL_REDIRECT_TO') ?? '')
      .split(',')
      .map((address) => address.trim())
      .filter(Boolean);

    if (!this.client) {
      this.logger.warn(
        'RESEND_API_KEY não configurada. O envio de e-mails está desativado.',
      );
    } else if (this.redirectTo.length > 0) {
      this.logger.warn(
        `EMAIL_REDIRECT_TO configurada. Todos os e-mails serão enviados para ${this.redirectTo.join(', ')}.`,
      );
    }
  }

  async send(input: SendEmailInput): Promise<void> {
    if (!this.client) {
      this.logger.warn(
        `E-mail "${input.subject}" não enviado: RESEND_API_KEY não configurada.`,
      );
      return;
    }

    try {
      const { error } = await this.client.emails.send({
        from: this.from,
        to: this.resolveRecipients(input.to),
        subject: input.subject,
        html: input.html,
        text: input.text,
        attachments: input.attachments,
      });

      if (error) {
        this.logger.error(
          `Falha ao enviar e-mail "${input.subject}": ${error.name} - ${error.message}`,
        );
      }
    } catch (error) {
      const failure = error instanceof Error ? error : new Error(String(error));
      this.logger.error(
        `Falha ao enviar e-mail "${input.subject}": ${failure.message}`,
        failure.stack,
      );
    }
  }

  // Ambiente de avaliação: entrega tudo num endereço fixo em vez do destinatário original.
  private resolveRecipients(to: SendEmailInput['to']): SendEmailInput['to'] {
    return this.redirectTo.length > 0 ? this.redirectTo : to;
  }
}
