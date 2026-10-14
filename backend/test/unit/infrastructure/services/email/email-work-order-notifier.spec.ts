import { Logger } from '@nestjs/common';
import { WorkOrder } from '@/domain/entities/work-order.entity';
import { WorkOrderItem } from '@/domain/entities/work-order-item.entity';
import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import { EmailWorkOrderNotifier } from '@/infrastructure/services/email/email-work-order-notifier';
import { FakeEmailSender } from '../../../../fakes/fake-email-sender';

describe('EmailWorkOrderNotifier', () => {
  let emailSender: FakeEmailSender;
  let users: any;
  let profiles: any;
  let vehicles: any;
  let repairs: any;
  let products: any;
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
    notifier = new EmailWorkOrderNotifier(
      emailSender,
      users,
      profiles,
      vehicles,
      repairs,
      products,
    );
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
    expect(email.attachments).toEqual([
      expect.objectContaining({ contentId: 'logo' }),
    ]);
    expect(repairs.findById).toHaveBeenCalledWith('repair-id');
    expect(products.findByIdIncludingInactive).toHaveBeenCalledWith(
      'product-id',
    );
    expect(profiles.findById).toHaveBeenCalledWith('client', 'profile-id');
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
