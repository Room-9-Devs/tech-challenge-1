import {
  WorkOrderAwaitingApprovalEmailData,
  renderWorkOrderAwaitingApprovalEmail,
} from '@/infrastructure/services/email/templates/work-order-awaiting-approval.template';
import { escapeHtml } from '@/infrastructure/services/email/templates/email-formatters';

describe('renderWorkOrderAwaitingApprovalEmail', () => {
  const data: WorkOrderAwaitingApprovalEmailData = {
    customerName: 'Maria Silva',
    orderNumber: 'OS-0042/2026',
    vehicle: 'Fiat Uno - ABC1D23',
    items: [
      { description: 'Troca de óleo', quantity: 1, subtotal: 120 },
      { description: 'Filtro de ar', quantity: 2, subtotal: 91 },
    ],
    total: 211,
    generatedAt: new Date('2026-10-06T12:00:00Z'),
  };

  // Intl separa "R$" do valor com espaço não separável
  const nbsp = String.fromCharCode(160);
  const brl = (value: string) => `R$${nbsp}${value}`;

  it('should include the order number in the subject', () => {
    const email = renderWorkOrderAwaitingApprovalEmail(data);

    expect(email.subject).toBe(
      'Orçamento da OS-0042/2026 disponível para aprovação',
    );
  });

  it('should render the header with the full title and the inline logo', () => {
    const { html, attachments } = renderWorkOrderAwaitingApprovalEmail(data);

    expect(html).toContain('OFICINA MECÂNICA');
    expect(html).toContain('- TECH CHALLENGE');
    expect(html).toContain('src="cid:logo"');
    expect(attachments).toEqual([
      expect.objectContaining({
        filename: 'logo.png',
        contentType: 'image/png',
        contentId: 'logo',
      }),
    ]);
    expect(attachments[0].content.length).toBeGreaterThan(0);
  });

  it('should render customer, vehicle, items and total in the html', () => {
    const { html } = renderWorkOrderAwaitingApprovalEmail(data);

    expect(html).toContain('Olá, Maria Silva!');
    expect(html).toContain('Fiat Uno - ABC1D23');
    expect(html).toContain('Troca de óleo');
    expect(html).toContain(brl('120,00'));
    expect(html).toContain(brl('91,00'));
    expect(html).toContain(brl('211,00'));
    expect(html).toContain('GERADO EM 06/10/2026');
  });

  it('should escape user provided values in the html', () => {
    const { html } = renderWorkOrderAwaitingApprovalEmail({
      ...data,
      customerName: '<script>alert(1)</script>',
    });

    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('should render the approval button only when a link is provided', () => {
    const withoutLink = renderWorkOrderAwaitingApprovalEmail(data);
    const withLink = renderWorkOrderAwaitingApprovalEmail({
      ...data,
      approvalUrl: 'https://oficina.example.com/os/2026-0042?a=1&b=2',
    });

    expect(withoutLink.html).not.toContain('APROVAR ORÇAMENTO');
    expect(withoutLink.html).toContain('acesse o sistema da oficina');
    expect(withLink.html).toContain('APROVAR ORÇAMENTO');
    expect(withLink.html).toContain(
      'href="https://oficina.example.com/os/2026-0042?a=1&amp;b=2"',
    );
  });

  it('should render a plain text version', () => {
    const { text } = renderWorkOrderAwaitingApprovalEmail(data);

    expect(text).toContain('Olá, Maria Silva!');
    expect(text).toContain(`- Filtro de ar (2x): ${brl('91,00')}`);
    expect(text).toContain(`Total: ${brl('211,00')}`);
    expect(text).not.toMatch(/<[a-z]/i);
  });

  it('should format the date in the Sao Paulo timezone', () => {
    const { html } = renderWorkOrderAwaitingApprovalEmail({
      ...data,
      generatedAt: new Date('2026-10-07T01:30:00Z'),
    });

    expect(html).toContain('GERADO EM 06/10/2026');
  });
});

describe('escapeHtml', () => {
  it('should escape html special characters', () => {
    expect(escapeHtml(`<a href="x">Tom & Jerry's</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;',
    );
  });
});
