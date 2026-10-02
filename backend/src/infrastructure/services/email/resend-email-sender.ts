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

  constructor(configService: ConfigService) {
    const apiKey = configService.get<string>('RESEND_API_KEY');

    this.from = configService.get<string>('EMAIL_FROM');
    this.client = apiKey ? new Resend(apiKey) : null;

    if (!this.client) {
      this.logger.warn(
        'RESEND_API_KEY não configurada. O envio de e-mails está desativado.',
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
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      });

      if (error) {
        this.logger.error(
          `Falha ao enviar e-mail "${input.subject}": ${error.name} - ${error.message}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Falha ao enviar e-mail "${input.subject}": ${error.message}`,
        error.stack,
      );
    }
  }
}
