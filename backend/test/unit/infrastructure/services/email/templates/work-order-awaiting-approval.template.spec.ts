import {
  WorkOrderAwaitingApprovalEmailData,
  renderWorkOrderAwaitingApprovalEmail,
} from '@/infrastructure/services/email/templates/work-order-awaiting-approval.template';

describe('renderWorkOrderAwaitingApprovalEmail', () => {
  const data: WorkOrderAwaitingApprovalEmailData = {
    customerName: 'Maria Silva',
    orderNumber: 'OS-0042/2026',
    vehicle: 'Fiat Uno - ABC1D23',
    items: [
      {
        description: 'Troca de óleo',
        quantity: 1,
        unitPrice: 120,
        subtotal: 120,
      },
      {
        description: 'Filtro de ar',
        quantity: 2,
        unitPrice: 45.5,
        subtotal: 91,
      },
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
    expect(html).toContain('VALOR UNIT.');
    expect(html).toContain(brl('45,50'));
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

  it('should render the approve and reject buttons only when the links are provided', () => {
    const withoutLink = renderWorkOrderAwaitingApprovalEmail(data);
    const withLink = renderWorkOrderAwaitingApprovalEmail({
      ...data,
      approveUrl: 'https://oficina.example.com/aprovacao/abc/approve?a=1&b=2',
      rejectUrl: 'https://oficina.example.com/aprovacao/abc/reject',
    });

    expect(withoutLink.html).not.toContain('APROVAR ORÇAMENTO');
    expect(withoutLink.html).not.toContain('RECUSAR');
    expect(withoutLink.html).toContain('acesse o sistema da oficina');
    expect(withLink.html).toContain('APROVAR ORÇAMENTO');
    expect(withLink.html).toContain('RECUSAR');
    expect(withLink.html).toContain(
      'href="https://oficina.example.com/aprovacao/abc/approve?a=1&amp;b=2"',
    );
    expect(withLink.html).toContain(
      'href="https://oficina.example.com/aprovacao/abc/reject"',
    );
    expect(withLink.html).toContain('revisar o orçamento antes de confirmar');
    expect(withLink.html).not.toContain('acesse o sistema da oficina');
  });

  it('should list both links in the plain text version', () => {
    const { text } = renderWorkOrderAwaitingApprovalEmail({
      ...data,
      approveUrl: 'https://oficina.example.com/aprovacao/abc/approve',
      rejectUrl: 'https://oficina.example.com/aprovacao/abc/reject',
    });

    expect(text).toContain(
      'Aprovar o orçamento: https://oficina.example.com/aprovacao/abc/approve',
    );
    expect(text).toContain(
      'Recusar o orçamento: https://oficina.example.com/aprovacao/abc/reject',
    );
  });

  it('should render a plain text version', () => {
    const { text } = renderWorkOrderAwaitingApprovalEmail(data);

    expect(text).toContain('Olá, Maria Silva!');
    expect(text).toContain(
      `- Filtro de ar: 2 x ${brl('45,50')} = ${brl('91,00')}`,
    );
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
