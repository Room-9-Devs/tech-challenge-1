import {
  WorkOrderCompletedEmailData,
  renderWorkOrderCompletedEmail,
} from '@/infrastructure/services/email/templates/work-order-completed.template';

describe('renderWorkOrderCompletedEmail', () => {
  const data: WorkOrderCompletedEmailData = {
    customerName: 'Maria Silva',
    orderNumber: 'OS-0042/2026',
    vehicle: 'Fiat Uno - ABC1D23',
    completedAt: new Date('2026-10-06T12:00:00Z'),
  };

  it('should include the order number in the subject', () => {
    const email = renderWorkOrderCompletedEmail(data);

    expect(email.subject).toBe('Serviço da OS-0042/2026 concluído');
  });

  it('should render customer, vehicle and completion date in the html', () => {
    const { html } = renderWorkOrderCompletedEmail(data);

    expect(html).toContain('Olá, Maria Silva!');
    expect(html).toContain('Fiat Uno - ABC1D23');
    expect(html).toContain('CONCLUÍDO EM 06/10/2026');
    expect(html).toContain('pronto para retirada');
  });

  it('should escape user provided values in the html', () => {
    const { html } = renderWorkOrderCompletedEmail({
      ...data,
      vehicle: '<b>Uno</b>',
    });

    expect(html).not.toContain('<b>Uno</b>');
    expect(html).toContain('&lt;b&gt;Uno&lt;/b&gt;');
  });

  it('should render a plain text version', () => {
    const { text } = renderWorkOrderCompletedEmail(data);

    expect(text).toContain(
      'O serviço do seu veículo Fiat Uno - ABC1D23 foi concluído.',
    );
    expect(text).toContain('OS-0042/2026 - concluída em 06/10/2026');
    expect(text).not.toMatch(/<[a-z]/i);
  });
});
