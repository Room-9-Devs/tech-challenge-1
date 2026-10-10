import { WorkOrder } from '@/domain/entities/work-order.entity';
import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import { EventType } from '@/domain/entities/event-type.entity';
import { CreateWorkOrderUseCase } from '@/application/use-cases/work-orders/create-work-order/create-work-order.use-case';
import { ListWorkOrdersUseCase } from '@/application/use-cases/work-orders/list-work-orders/list-work-orders.use-case';
import { FindWorkOrderUseCase } from '@/application/use-cases/work-orders/find-work-order/find-work-order.use-case';
import { AddWorkOrderItemUseCase } from '@/application/use-cases/work-orders/add-work-order-item/add-work-order-item.use-case';
import { ChangeWorkOrderItemUseCase } from '@/application/use-cases/work-orders/change-work-order-item/change-work-order-item.use-case';
import { RemoveWorkOrderItemUseCase } from '@/application/use-cases/work-orders/remove-work-order-item/remove-work-order-item.use-case';
import { ChangeWorkOrderStatusUseCase } from '@/application/use-cases/work-orders/change-work-order-status/change-work-order-status.use-case';
import { ConfirmWorkOrderPaymentUseCase } from '@/application/use-cases/work-orders/confirm-work-order-payment/confirm-work-order-payment.use-case';

describe('Work order use cases', () => {
  const staff = {
    id: 'staff-id',
    username: 'staff',
    entityType: 'employee' as const,
  };
  const client = {
    id: 'client-id',
    username: 'client',
    entityType: 'client' as const,
  };
  let orders: WorkOrder[];
  let events: any[];
  let repositories: any;
  let vehicles: any;
  let users: any;
  let profiles: any;
  let email: any;
  let unitOfWork: any;
  let create: CreateWorkOrderUseCase;
  let list: ListWorkOrdersUseCase;
  let find: FindWorkOrderUseCase;
  let addItem: AddWorkOrderItemUseCase;
  let changeItem: ChangeWorkOrderItemUseCase;
  let removeItem: RemoveWorkOrderItemUseCase;
  let changeStatus: ChangeWorkOrderStatusUseCase;
  let confirmPayment: ConfirmWorkOrderPaymentUseCase;

  beforeEach(() => {
    orders = [];
    events = [];
    vehicles = {
      findById: jest
        .fn()
        .mockResolvedValue({ id: 'vehicle-id', user_id: 'client-id' }),
    };
    users = {
      findById: jest.fn().mockResolvedValue({
        id: 'client-id',
        username: 'client',
        email: 'client@test.local',
        entityId: 'profile-id',
      }),
    };
    profiles = {
      findById: jest
        .fn()
        .mockResolvedValue({
          id: 'profile-id',
          name: 'Cliente',
          type: 'client',
          phone: '11999999999',
        }),
    };
    email = { send: jest.fn().mockResolvedValue(undefined) };
    const stock = {
      id: 'stock-id',
      available: 10,
      quantity: 10,
      reserve: jest.fn(),
      releaseReservation: jest.fn(),
      consumeReservation: jest.fn(),
    };
    repositories = {
      workOrders: {
        save: jest.fn(async (order: WorkOrder) => {
          orders = orders.filter((existing) => existing.id !== order.id);
          orders.push(order);
          return order;
        }),
        findById: jest.fn(
          async (id: string) => orders.find((order) => order.id === id) ?? null,
        ),
        findAll: jest
          .fn()
          .mockResolvedValue({
            data: [],
            meta: { page: 1, limit: 10, totalItems: 0, totalPages: 1 },
          }),
        deleteItem: jest.fn(),
      },
      products: {
        findById: jest
          .fn()
          .mockResolvedValue({ id: 'product-id', salePrice: 30, active: true }),
      },
      repairs: {
        findById: jest
          .fn()
          .mockResolvedValue({ id: 'repair-id', unitValue: 125 }),
      },
      stocks: {
        findByProductId: jest.fn().mockResolvedValue(stock),
        save: jest.fn(),
      },
      stockMovements: { save: jest.fn() },
      events: {
        findByEntity: jest.fn(async (_entityType: string, entityId: string) =>
          events.filter((event) => event.entityId === entityId),
        ),
        save: jest.fn(async (event: any) => {
          events.push(event);
          return event;
        }),
      },
      eventTypes: {
        findByCode: jest.fn(async (code: string) =>
          EventType.create({
            code,
            name: code,
            allowedEntityTypes: ['work_order', 'stock'],
          }),
        ),
      },
    };
    unitOfWork = {
      run: jest.fn((callback: (r: any) => unknown) => callback(repositories)),
    };
    create = new CreateWorkOrderUseCase(vehicles, unitOfWork, {
      next: jest.fn().mockResolvedValue('OS-0001/2026'),
    } as any);
    list = new ListWorkOrdersUseCase(repositories.workOrders);
    find = new FindWorkOrderUseCase(
      repositories.workOrders,
      vehicles,
      users,
      profiles,
    );
    addItem = new AddWorkOrderItemUseCase(unitOfWork);
    changeItem = new ChangeWorkOrderItemUseCase(unitOfWork);
    removeItem = new RemoveWorkOrderItemUseCase(unitOfWork);
    changeStatus = new ChangeWorkOrderStatusUseCase(
      repositories.workOrders,
      unitOfWork,
      users,
      email,
    );
    confirmPayment = new ConfirmWorkOrderPaymentUseCase(unitOfWork);
  });

  async function createOrder() {
    return create.execute({
      vehicleId: 'vehicle-id',
      observations: 'barulho',
      actor: staff,
    });
  }

  it('creates an order using the vehicle owner and the authenticated staff member', async () => {
    const order = await createOrder();
    expect(order.clientId).toBe('client-id');
    expect(order.createdBy).toBe(staff.id);
    expect(order.number).toBe('OS-0001/2026');
    expect(events).toHaveLength(1);
  });

  it('scopes customer listing and order details to their own orders', async () => {
    await list.execute({ query: { page: 1, limit: 10 }, actor: client });
    expect(repositories.workOrders.findAll).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      clientId: client.id,
    });
    const order = await createOrder();
    await expect(
      find.execute({
        id: order.id,
        actor: { ...client, id: 'another-client' },
      }),
    ).rejects.toThrow('Você não tem acesso');
    const detail = await find.execute({ id: order.id, actor: client });
    expect(detail.order.id).toBe(order.id);
    expect(detail.profile?.name).toBe('Cliente');
  });

  it('freezes catalog prices and recalculates totals for repair and product items', async () => {
    const order = await createOrder();
    const withRepair = await addItem.execute({
      id: order.id,
      serviceId: 'repair-id',
      quantity: 1.5,
      actor: staff,
    });
    expect(withRepair.items[0].unitPrice).toBe(125);
    expect(withRepair.totalPrice).toBe(187.5);
    const withProduct = await addItem.execute({
      id: order.id,
      productId: 'product-id',
      quantity: 2,
      actor: staff,
    });
    expect(withProduct.items[1].unitPrice).toBe(30);
    expect(withProduct.totalPrice).toBe(247.5);
    await changeItem.execute({
      id: order.id,
      itemId: withProduct.items[1].id,
      quantity: 3,
      actor: staff,
    });
    expect(orders[0].totalPrice).toBe(277.5);
    await removeItem.execute({
      id: order.id,
      itemId: withProduct.items[0].id,
      actor: staff,
    });
    expect(orders[0].totalPrice).toBe(90);
  });

  it('rejects fractional product quantities and insufficient stock', async () => {
    const order = await createOrder();
    await expect(
      addItem.execute({
        id: order.id,
        productId: 'product-id',
        quantity: 1.5,
        actor: staff,
      }),
    ).rejects.toThrow('quantidade de produtos deve ser inteira');
    repositories.stocks.findByProductId.mockResolvedValueOnce({
      ...(await repositories.stocks.findByProductId()),
      available: 0,
    });
    await expect(
      addItem.execute({
        id: order.id,
        productId: 'product-id',
        quantity: 1,
        actor: staff,
      }),
    ).rejects.toThrow('Saldo insuficiente');
  });

  it('reserves stock and sends the quote email after persisting the approval request', async () => {
    const order = await createOrder();
    await addItem.execute({
      id: order.id,
      productId: 'product-id',
      quantity: 2,
      actor: staff,
    });
    await changeStatus.execute({
      id: order.id,
      status: WorkOrderStatus.UNDER_DIAGNOSIS,
      note: 'Diagnóstico',
      actor: staff,
    });
    const updated = await changeStatus.execute({
      id: order.id,
      status: WorkOrderStatus.AWAITING_APPROVAL,
      note: 'Orçamento enviado',
      actor: staff,
    });
    expect(updated.status).toBe(WorkOrderStatus.AWAITING_APPROVAL);
    expect(repositories.stocks.findByProductId).toHaveBeenCalled();
    expect(email.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'client@test.local' }),
    );
  });

  it('allows a customer to decide only their own quote while awaiting approval', async () => {
    const order = await createOrder();
    await addItem.execute({
      id: order.id,
      serviceId: 'repair-id',
      quantity: 1,
      actor: staff,
    });
    await changeStatus.execute({
      id: order.id,
      status: WorkOrderStatus.UNDER_DIAGNOSIS,
      note: 'Diagnóstico',
      actor: staff,
    });
    await changeStatus.execute({
      id: order.id,
      status: WorkOrderStatus.AWAITING_APPROVAL,
      note: 'Orçamento',
      actor: staff,
    });
    await expect(
      changeStatus.execute({
        id: order.id,
        status: WorkOrderStatus.APPROVED,
        note: 'Aprovo',
        actor: { ...client, id: 'other-client' },
      }),
    ).rejects.toThrow('Cliente só pode aprovar ou recusar');
    const approved = await changeStatus.execute({
      id: order.id,
      status: WorkOrderStatus.APPROVED,
      note: 'Aprovo',
      actor: client,
    });
    expect(approved.status).toBe(WorkOrderStatus.APPROVED);
  });

  it('requires an approved order for payment and records payment before work starts', async () => {
    const order = await createOrder();
    await expect(
      confirmPayment.execute({ id: order.id, actor: staff }),
    ).rejects.toThrow('Pagamento só pode ser confirmado');
    await addItem.execute({
      id: order.id,
      serviceId: 'repair-id',
      quantity: 1,
      actor: staff,
    });
    await changeStatus.execute({
      id: order.id,
      status: WorkOrderStatus.UNDER_DIAGNOSIS,
      note: 'Diagnóstico',
      actor: staff,
    });
    await changeStatus.execute({
      id: order.id,
      status: WorkOrderStatus.AWAITING_APPROVAL,
      note: 'Orçamento',
      actor: staff,
    });
    await changeStatus.execute({
      id: order.id,
      status: WorkOrderStatus.APPROVED,
      note: 'Aprovado',
      actor: client,
    });
    await confirmPayment.execute({ id: order.id, actor: staff });
    const inProgress = await changeStatus.execute({
      id: order.id,
      status: WorkOrderStatus.IN_PROGRESS,
      note: 'Início',
      actor: staff,
    });
    expect(inProgress.status).toBe(WorkOrderStatus.IN_PROGRESS);
    await expect(
      confirmPayment.execute({ id: order.id, actor: staff }),
    ).rejects.toThrow('Pagamento só pode ser confirmado');
  });
});
