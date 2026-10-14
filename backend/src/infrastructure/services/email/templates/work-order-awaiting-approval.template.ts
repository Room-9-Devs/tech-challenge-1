import {
  EMAIL_COLORS,
  EMAIL_FONT,
  EMAIL_FOOTER_TEXT,
  EMAIL_TEXT_STYLE,
  RenderedEmail,
  renderEmailHeading,
  renderEmailLayout,
} from './email-layout';
import { escapeHtml, formatCurrency, formatDate } from './email-formatters';

export interface WorkOrderEmailItem {
  description: string;
  quantity: number;
  subtotal: number;
}

export interface WorkOrderAwaitingApprovalEmailData {
  customerName: string;
  orderNumber: string;
  vehicle: string;
  items: WorkOrderEmailItem[];
  total: number;
  generatedAt: Date;
  approvalUrl?: string;
}

const NO_LINK_MESSAGE =
  'Para aprovar ou recusar o orçamento, acesse o sistema da oficina.';

export function renderWorkOrderAwaitingApprovalEmail(
  data: WorkOrderAwaitingApprovalEmailData,
): RenderedEmail {
  const subject = `Orçamento da ${data.orderNumber} disponível para aprovação`;

  return {
    subject,
    ...renderEmailLayout({
      title: subject,
      preheader: `Total de ${formatCurrency(data.total)} para o seu ${data.vehicle}.`,
      content: renderContent(data),
    }),
    text: renderText(data),
  };
}

function renderContent(data: WorkOrderAwaitingApprovalEmailData): string {
  const colors = EMAIL_COLORS;
  const cellStyle = `font-family:${EMAIL_FONT};padding:12px 0;border-bottom:1px solid ${colors.border};font-size:14px;`;
  const headerCellStyle = `font-family:${EMAIL_FONT};padding:0 0 8px 0;border-bottom:1px solid ${colors.border};font-size:11px;font-weight:700;letter-spacing:1px;color:${colors.textMuted};`;

  const itemRows = data.items
    .map(
      (item) => `
              <tr>
                <td style="${cellStyle}color:${colors.text};">${escapeHtml(item.description)}</td>
                <td align="center" style="${cellStyle}color:${colors.textSecondary};">${item.quantity}</td>
                <td align="right" style="${cellStyle}color:${colors.text};white-space:nowrap;">${formatCurrency(item.subtotal)}</td>
              </tr>`,
    )
    .join('');

  const callToAction = data.approvalUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:32px;">
              <tr>
                <td style="border:1px solid ${colors.primary};">
                  <a href="${escapeHtml(data.approvalUrl)}" style="display:inline-block;padding:14px 40px;font-family:${EMAIL_FONT};font-size:14px;font-weight:700;letter-spacing:1px;color:${colors.primary};text-decoration:none;">APROVAR ORÇAMENTO</a>
                </td>
              </tr>
            </table>`
    : `<p style="margin:32px 0 0 0;${EMAIL_TEXT_STYLE}">${NO_LINK_MESSAGE}</p>`;

  return `${renderEmailHeading({
    highlight: data.orderNumber,
    title: 'Orçamento disponível',
    caption: `GERADO EM ${formatDate(data.generatedAt)}`,
  })}
            <p style="margin:24px 0 0 0;${EMAIL_TEXT_STYLE}">Olá, ${escapeHtml(data.customerName)}!</p>
            <p style="margin:8px 0 0 0;${EMAIL_TEXT_STYLE}">O orçamento do seu veículo <strong style="color:${colors.text};">${escapeHtml(data.vehicle)}</strong> está pronto. Confira os itens abaixo:</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${colors.surface}" style="margin-top:24px;background-color:${colors.surface};border-left:4px solid ${colors.primary};">
              <tr>
                <td style="padding:24px;">
                  <p style="margin:0 0 16px 0;font-family:${EMAIL_FONT};font-size:14px;font-weight:700;letter-spacing:1px;color:${colors.text};">SERVIÇOS E PEÇAS</p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td style="${headerCellStyle}">ITEM</td>
                      <td align="center" style="${headerCellStyle}">QTD</td>
                      <td align="right" style="${headerCellStyle}">VALOR</td>
                    </tr>${itemRows}
                    <tr>
                      <td colspan="2" style="font-family:${EMAIL_FONT};padding-top:16px;font-size:14px;font-weight:700;letter-spacing:1px;color:${colors.text};">TOTAL</td>
                      <td align="right" style="font-family:${EMAIL_FONT};padding-top:16px;font-size:18px;font-weight:700;color:${colors.primary};white-space:nowrap;">${formatCurrency(data.total)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            ${callToAction}`;
}

function renderText(data: WorkOrderAwaitingApprovalEmailData): string {
  const items = data.items
    .map(
      (item) =>
        `- ${item.description} (${item.quantity}x): ${formatCurrency(item.subtotal)}`,
    )
    .join('\n');

  const callToAction = data.approvalUrl
    ? `Aprove o orçamento em: ${data.approvalUrl}`
    : NO_LINK_MESSAGE;

  return [
    `Olá, ${data.customerName}!`,
    `O orçamento do seu veículo ${data.vehicle} está pronto.`,
    `${data.orderNumber} - gerado em ${formatDate(data.generatedAt)}`,
    `Serviços e peças:\n${items}`,
    `Total: ${formatCurrency(data.total)}`,
    callToAction,
    EMAIL_FOOTER_TEXT,
  ].join('\n\n');
}
