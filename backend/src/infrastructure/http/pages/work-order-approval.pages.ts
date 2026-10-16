import { GetWorkOrderApprovalOutputDto } from '@/application/use-cases/work-order-approvals/get-work-order-approval/get-work-order-approval-output.dto';
import { DecideWorkOrderApprovalOutputDto } from '@/application/use-cases/work-order-approvals/decide-work-order-approval/decide-work-order-approval-output.dto';
import { WorkOrderApprovalDecision } from '@/application/use-cases/work-order-approvals/work-order-approval-decision.enum';
import {
  escapeHtml,
  formatCurrency,
  formatDate,
} from '@/shared/presentation/formatters';
import { renderPageLayout } from './page-layout';

export const APPROVAL_REASON_MAX_LENGTH = 500;

function renderHeading(highlight: string, title: string, caption: string) {
  return `<h1><strong>${escapeHtml(highlight)}</strong> - ${escapeHtml(title)}</h1>
    <p class="caption">${escapeHtml(caption)}</p>`;
}

function renderQuote(quote: GetWorkOrderApprovalOutputDto): string {
  const rows = quote.items
    .map(
      (item) => `
          <tr>
            <td>${escapeHtml(item.description)}</td>
            <td class="center">${item.quantity}</td>
            <td class="right muted">${formatCurrency(item.unitPrice)}</td>
            <td class="right">${formatCurrency(item.subtotal)}</td>
          </tr>`,
    )
    .join('');

  return `<p>Olá, ${escapeHtml(quote.customerName)}!</p>
    <p>Orçamento do veículo <strong>${escapeHtml(quote.vehicle)}</strong>:</p>
    <div class="quote">
      <p class="quote-title">SERVIÇOS E PEÇAS</p>
      <table>
        <thead>
          <tr><th>ITEM</th><th class="center">QTD</th><th class="right">VALOR UNIT.</th><th class="right">TOTAL</th></tr>
        </thead>
        <tbody>${rows}
          <tr class="total">
            <td colspan="3">TOTAL</td>
            <td class="right">${formatCurrency(quote.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>`;
}

// O formulário não tem "action": o POST vai para a mesma URL, que já carrega o token.
// O botão não tem "name" para não virar campo extra (o ValidationPipe rejeita campos fora do DTO).
export function renderApprovalConfirmPage(
  quote: GetWorkOrderApprovalOutputDto,
  decision: WorkOrderApprovalDecision,
): string {
  const approving = decision === WorkOrderApprovalDecision.APPROVE;
  const title = approving ? 'Aprovar orçamento' : 'Recusar orçamento';

  const form = approving
    ? `<form method="POST">
      <button type="submit">CONFIRMAR APROVAÇÃO</button>
    </form>
    <p class="switch">Mudou de ideia? <a href="./reject">Recusar orçamento</a></p>`
    : `<form method="POST">
      <label for="reason">Motivo da recusa (opcional)</label>
      <textarea id="reason" name="reason" maxlength="${APPROVAL_REASON_MAX_LENGTH}"></textarea>
      <button type="submit" class="secondary">CONFIRMAR RECUSA</button>
    </form>
    <p class="switch">Mudou de ideia? <a href="./approve">Aprovar orçamento</a></p>`;

  return renderPageLayout({
    title: `${title} ${quote.orderNumber}`,
    content: `${renderHeading(quote.orderNumber, title, `GERADO EM ${formatDate(quote.generatedAt)}`)}
    ${renderQuote(quote)}
    ${form}`,
  });
}

export function renderApprovalResultPage(
  result: DecideWorkOrderApprovalOutputDto,
): string {
  const approved = result.decision === WorkOrderApprovalDecision.APPROVE;
  const title = approved ? 'Orçamento aprovado' : 'Orçamento recusado';
  const message = approved
    ? 'Obrigado! A oficina vai entrar em contato para confirmar o pagamento e iniciar o serviço.'
    : 'Sua resposta foi registrada. Entre em contato com a oficina para combinar a retirada do veículo.';

  return renderPageLayout({
    title: `${title} ${result.orderNumber}`,
    content: `${renderHeading(result.orderNumber, title, 'RESPOSTA REGISTRADA')}
    <p class="notice">${message}</p>`,
  });
}

export function renderApprovalInvalidPage(): string {
  return renderPageLayout({
    title: 'Link inválido ou expirado',
    content: `<h1><strong>Link inválido ou expirado</strong></h1>
    <p class="notice">Este link não é mais válido. Ele pode ter expirado ou o orçamento já foi respondido.</p>
    <p>Para consultar a ordem de serviço, acesse o sistema da oficina ou entre em contato com a equipe.</p>`,
  });
}

export function renderApprovalErrorPage(): string {
  return renderPageLayout({
    title: 'Não foi possível registrar a resposta',
    content: `<h1><strong>Não foi possível registrar a sua resposta</strong></h1>
    <p class="notice">Tente novamente mais tarde ou entre em contato com a oficina.</p>`,
  });
}
