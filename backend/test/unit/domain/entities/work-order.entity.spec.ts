import { InvalidWorkOrderError } from '@/domain/errors/invalid-work-order.error';
import { WorkOrder } from '@/domain/entities/work-order.entity';
import { WorkOrderItem } from '@/domain/entities/work-order-item.entity';
import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';

const validWorkOrderProps = {
  number: 'OS-0001/2026',
  vehicleId: 'vehicle-id',
  clientId: 'client-user-id',
  createdBy: 'employee-user-id',
};

describe('WorkOrder Entity', () => {
  it('creates an order with defaults and no items', () => {
    const order = WorkOrder.create(validWorkOrderProps);

    expect(order.id).toBeDefined();
    expect(order.number).toBe('OS-0001/2026');
    expect(order.status).toBe(WorkOrderStatus.RECEIVED);
    expect(order.vehicleId).toBe('vehicle-id');
    expect(order.clientId).toBe('client-user-id');
    expect(order.createdBy).toBe('employee-user-id');
    expect(order.items).toEqual([]);
    expect(order.totalPrice).toBe(0);
    expect(order.observations).toBeNull();
    expect(order.createdAt).toBeInstanceOf(Date);
    expect(order.updatedAt).toBeInstanceOf(Date);
  });

  it('preserves observations, status, identifiers, and dates when reconstituted', () => {
    const createdAt = new Date('2026-01-01T12:00:00.000Z');
    const updatedAt = new Date('2026-01-02T12:00:00.000Z');
    const order = WorkOrder.reconstitute({
      ...validWorkOrderProps,
      id: 'work-order-id',
      status: WorkOrderStatus.UNDER_DIAGNOSIS,
      observations: '  Ruído no motor  ',
      createdAt,
      updatedAt,
    });

    expect(order.id).toBe('work-order-id');
    expect(order.status).toBe(WorkOrderStatus.UNDER_DIAGNOSIS);
    expect(order.observations).toBe('Ruído no motor');
    expect(order.createdAt).toBe(createdAt);
    expect(order.updatedAt).toBe(updatedAt);
  });

  it.each(['', '2026-0001', 'OS-1/2026', 'OS-0001/26'])(
    'rejects invalid number %s',
    (number) => {
      expect(() =>
        WorkOrder.create({ ...validWorkOrderProps, number }),
      ).toThrow(InvalidWorkOrderError);
    },
  );

  it.each(['vehicleId', 'clientId', 'createdBy'] as const)(
    'requires %s',
    (field) => {
      expect(() =>
        WorkOrder.create({ ...validWorkOrderProps, [field]: ' ' }),
      ).toThrow(InvalidWorkOrderError);
    },
  );

  it('rejects a status outside the enum', () => {
    expect(() =>
      WorkOrder.create({
        ...validWorkOrderProps,
        status: 'unknown' as WorkOrderStatus,
      }),
    ).toThrow(InvalidWorkOrderError);
  });

  it('calculates total from frozen item prices and supports fractional quantities', () => {
    const repairItem = WorkOrderItem.create({
      serviceId: 'repair-id',
      quantity: 1,
      unitPrice: 100,
    });
    const productItem = WorkOrderItem.create({
      productId: 'product-id',
      quantity: 1.5,
      unitPrice: 20,
    });
    const order = WorkOrder.create({
      ...validWorkOrderProps,
      items: [repairItem, productItem],
    });

    expect(order.totalPrice).toBe(130);
    expect(order.items).toHaveLength(2);
    expect(order.items).not.toBe(order.items);
    expect(productItem.quantity).toBe(1.5);
    expect(productItem.unitPrice).toBe(20);
  });

  it('updates total when items are added and removed', () => {
    const order = WorkOrder.create(validWorkOrderProps);
    const item = WorkOrderItem.create({
      productId: 'product-id',
      quantity: 2,
      unitPrice: 15,
    });

    order.addItem(item);
    expect(order.totalPrice).toBe(30);
    expect(order.removeItem(item.id)).toBe(true);
    expect(order.totalPrice).toBe(0);
    expect(order.removeItem(item.id)).toBe(false);
  });

  it('enforces the work-order status transition flow', () => {
    const order = WorkOrder.create(validWorkOrderProps);
    const item = WorkOrderItem.create({
      serviceId: 'repair-id',
      quantity: 1,
      unitPrice: 50,
    });

    order.changeStatus(WorkOrderStatus.UNDER_DIAGNOSIS);
    order.addItem(item);
    order.changeStatus(WorkOrderStatus.AWAITING_APPROVAL);
    order.changeStatus(WorkOrderStatus.APPROVED);
    order.changeStatus(WorkOrderStatus.IN_PROGRESS);
    order.changeStatus(WorkOrderStatus.COMPLETED);
    order.changeStatus(WorkOrderStatus.DELIVERED);

    expect(order.status).toBe(WorkOrderStatus.DELIVERED);
  });

  it('requires at least one item before sending the quote for approval', () => {
    const order = WorkOrder.create(validWorkOrderProps);
    order.changeStatus(WorkOrderStatus.UNDER_DIAGNOSIS);

    expect(() => order.changeStatus(WorkOrderStatus.AWAITING_APPROVAL)).toThrow(
      InvalidWorkOrderError,
    );
  });

  it('normalizes observations and allows clearing them', () => {
    const order = WorkOrder.create(validWorkOrderProps);

    order.changeObservations('  Barulho ao frear  ');
    expect(order.observations).toBe('Barulho ao frear');
    order.changeObservations(null);
    expect(order.observations).toBeNull();
  });
});
