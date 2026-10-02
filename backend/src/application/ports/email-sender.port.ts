export const EMAIL_SENDER = Symbol('EMAIL_SENDER');

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

// Envio best-effort: falhas são registradas em log e nunca interrompem o fluxo de quem chama.
export interface EmailSender {
  send(input: SendEmailInput): Promise<void>;
}
