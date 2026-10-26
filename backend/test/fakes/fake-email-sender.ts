import {
  EmailSender,
  SendEmailInput,
} from '@/application/ports/email-sender.port';

export class FakeEmailSender implements EmailSender {
  private sentEmails: SendEmailInput[] = [];

  async send(input: SendEmailInput): Promise<void> {
    this.sentEmails.push(input);
  }

  getSentEmails(): SendEmailInput[] {
    return [...this.sentEmails];
  }

  clear(): void {
    this.sentEmails = [];
  }
}
