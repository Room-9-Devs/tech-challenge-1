export const EMAIL_SENDER = Symbol('EMAIL_SENDER');

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
  // Anexo inline: referenciado no HTML como cid:<contentId>
  contentId?: string;
}

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
}

// Envio best-effort: falhas são registradas em log e nunca interrompem o fluxo de quem chama.
export interface EmailSender {
  send(input: SendEmailInput): Promise<void>;
}
