import {
  EMAIL_COLORS,
  EMAIL_FONT,
  EMAIL_FOOTER_TEXT,
  EMAIL_TEXT_STYLE,
  RenderedEmail,
  renderEmailHeading,
  renderEmailLayout,
} from './email-layout';
import { escapeHtml, formatDate } from './email-formatters';

export interface WorkOrderCompletedEmailData {
  customerName: string;
  orderNumber: string;
  vehicle: string;
  completedAt: Date;
}

const PICKUP_MESSAGE = 'Seu veículo já está pronto para retirada na oficina.';

export function renderWorkOrderCompletedEmail(
  data: WorkOrderCompletedEmailData,
): RenderedEmail {
  const subject = `Serviço da ${data.orderNumber} concluído`;

  return {
    subject,
    ...renderEmailLayout({
      title: subject,
      preheader: `O serviço do seu ${data.vehicle} foi concluído.`,
      content: renderContent(data),
    }),
    text: renderText(data),
  };
}

function renderContent(data: WorkOrderCompletedEmailData): string {
  const colors = EMAIL_COLORS;

  return `${renderEmailHeading({
    highlight: data.orderNumber,
    title: 'Serviço concluído',
    caption: `CONCLUÍDO EM ${formatDate(data.completedAt)}`,
  })}
            <p style="margin:24px 0 0 0;${EMAIL_TEXT_STYLE}">Olá, ${escapeHtml(data.customerName)}!</p>
            <p style="margin:8px 0 0 0;${EMAIL_TEXT_STYLE}">O serviço do seu veículo <strong style="color:${colors.text};">${escapeHtml(data.vehicle)}</strong> foi concluído.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${colors.surface}" style="margin-top:24px;background-color:${colors.surface};border-left:4px solid ${colors.primary};">
              <tr>
                <td style="padding:24px;">
                  <p style="margin:0 0 8px 0;font-family:${EMAIL_FONT};font-size:14px;font-weight:700;letter-spacing:1px;color:${colors.text};">PRÓXIMO PASSO</p>
                  <p style="margin:0;${EMAIL_TEXT_STYLE}">${PICKUP_MESSAGE}</p>
                </td>
              </tr>
            </table>`;
}

function renderText(data: WorkOrderCompletedEmailData): string {
  return [
    `Olá, ${data.customerName}!`,
    `O serviço do seu veículo ${data.vehicle} foi concluído.`,
    `${data.orderNumber} - concluída em ${formatDate(data.completedAt)}`,
    PICKUP_MESSAGE,
    EMAIL_FOOTER_TEXT,
  ].join('\n\n');
}
