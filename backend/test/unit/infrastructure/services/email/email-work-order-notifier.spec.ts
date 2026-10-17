import { Logger } from '@nestjs/common';
import { WorkOrder } from '@/domain/entities/work-order.entity';
import { WorkOrderItem } from '@/domain/entities/work-order-item.entity';
import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import { EmailWorkOrderNotifier } from '@/infrastructure/services/email/email-work-order-notifier';
import { WorkOrderQuoteService } from '@/application/services/work-order-quote.service';
import { FakeEmailSender } from '../../../../fakes/fake-email-sender';

describe('EmailWorkOrderNotifier', () => {
  let emailSender: FakeEmailSender;
  let users: any;
  let profiles: any;
  let vehicles: any;
  let repairs: any;
  let products: any;
  let settings: Record<string, string>;
  let notifier: EmailWorkOrderNotifier;
  let errorSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  const order = WorkOrder.reconstitute({
    id: 'order-id',
    number: 'OS-0042/2026',
    status: WorkOrderStatus.AWAITING_APPROVAL,
    vehicleId: 'vehicle-id',
    clientId: 'client-id',
    createdBy: 'staff-id',
    items: [
      WorkOrderItem.reconstitute({
        quantity: 1,
        unitPrice: 150,
        serviceId: 'repair-id',
      }),
      WorkOrderItem.reconstitute({
        quantity: 2,
        unitPrice: 45.5,
        productId: 'product-id',
      }),
    ],
    updatedAt: new Date('2026-10-06T12:00:00Z'),
  });

  beforeEach(() => {
    emailSender = new FakeEmailSender();
    users = {
      findById: jest.fn().mockResolvedValue({
        id: 'client-id',
        username: 'maria.silva',
        email: 'maria@cliente.com',
        entityId: 'profile-id',
      }),
    };
    profiles = {
      findById: jest.fn().mockResolvedValue({ name: 'Maria Silva' }),
    };
    vehicles = {
      findById: jest.fn().mockResolvedValue({
        brand: 'Fiat',
        model: 'Uno',
        license_plate: 'ABC1D23',
      }),
    };
    repairs = {
      findById: jest
        .fn()
        .mockResolvedValue({ description: 'Alinhamento e balanceamento' }),
    };
    products = {
      findByIdIncludingInactive: jest
        .fn()
        .mockResolvedValue({ name: 'Filtro de óleo' }),
    };
    settings = { APP_PUBLIC_URL: 'https://oficina.example.com/' };
    notifier = createNotifier();
    errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createNotifier() {
    return new EmailWorkOrderNotifier(
      emailSender,
      new WorkOrderQuoteService(users, profiles, vehicles, repairs, products),
      { get: (key: string) => settings[key] } as any,
    );
  }

  it('should send the quote to the client with item descriptions and vehicle', async () => {
    await notifier.notifyAwaitingApproval(order);

    const [email] = emailSender.getSentEmails();
    expect(email.to).toBe('maria@cliente.com');
    expect(email.subject).toBe(
      'Orçamento da OS-0042/2026 disponível para aprovação',
    );
    expect(email.html).toContain('Olá, Maria Silva!');
    expect(email.html).toContain('Fiat Uno - ABC1D23');
    expect(email.html).toContain('Alinhamento e balanceamento');
    expect(email.html).toContain('Filtro de óleo');
    expect(email.text).toContain('Total: R$');
    expect(email.text).toContain('241,00');
    expect(email.text).toContain('Filtro de óleo: 2 x R$');
    expect(email.html).toContain('45,50');
    expect(email.attachments).toEqual([
      expect.objectContaining({ contentId: 'logo' }),
    ]);
    expect(repairs.findById).toHaveBeenCalledWith('repair-id');
    expect(products.findByIdIncludingInactive).toHaveBeenCalledWith(
      'product-id',
    );
    expect(profiles.findById).toHaveBeenCalledWith('client', 'profile-id');
  });

  it('should include the approve and reject links when a token is provided', async () => {
    await notifier.notifyAwaitingApproval(order, 'token_abc-123');

    const [email] = emailSender.getSentEmails();
    expect(email.html).toContain(
      'href="https://oficina.example.com/work-order-approvals/token_abc-123/approve"',
    );
    expect(email.html).toContain(
      'href="https://oficina.example.com/work-order-approvals/token_abc-123/reject"',
    );
    expect(email.text).toContain(
      'https://oficina.example.com/work-order-approvals/token_abc-123/reject',
    );
  });

  it('should send the quote without links when no token is provided', async () => {
    await notifier.notifyAwaitingApproval(order);

    const [email] = emailSender.getSentEmails();
    expect(email.html).not.toContain('work-order-approvals');
    expect(email.html).toContain('acesse o sistema da oficina');
  });

  it('should fall back to localhost when the public url is not configured', async () => {
    settings = { PORT: '4000' };
    notifier = createNotifier();

    await notifier.notifyAwaitingApproval(order, 'token_abc-123');

    expect(emailSender.getSentEmails()[0].html).toContain(
      'http://localhost:4000/work-order-approvals/token_abc-123/approve',
    );
  });

  it('should send the completion email to the client', async () => {
    await notifier.notifyCompleted(order);

    const [email] = emailSender.getSentEmails();
    expect(email.to).toBe('maria@cliente.com');
    expect(email.subject).toBe('Serviço da OS-0042/2026 concluído');
    expect(email.html).toContain('Fiat Uno - ABC1D23');
  });

  it('should fall back to the username when the client profile is missing', async () => {
    profiles.findById.mockResolvedValue(null);

    await notifier.notifyCompleted(order);

    expect(emailSender.getSentEmails()[0].html).toContain('Olá, maria.silva!');
  });

  it('should skip and warn when the client is not found', async () => {
    users.findById.mockResolvedValue(null);

    await notifier.notifyAwaitingApproval(order);

    expect(emailSender.getSentEmails()).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('OS-0042/2026'),
    );
  });

  it('should log and not throw when loading the email data fails', async () => {
    vehicles.findById.mockRejectedValue(new Error('Database offline'));

    await expect(
      notifier.notifyAwaitingApproval(order),
    ).resolves.toBeUndefined();
    expect(emailSender.getSentEmails()).toHaveLength(0);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Database offline'),
      expect.any(String),
    );
  });
});
