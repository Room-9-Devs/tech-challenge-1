import { InvalidWorkOrderItemError } from '@/domain/errors/invalid-work-order-item.error';
import { WorkOrderItem } from '@/domain/entities/work-order-item.entity';

describe('WorkOrderItem Entity', () => {
  it('creates an item linked to a service', () => {
    const item = WorkOrderItem.create({
      serviceId: 'repair-id',
      quantity: 1,
      unitPrice: 120,
    });

    expect(item.id).toBeDefined();
    expect(item.serviceId).toBe('repair-id');
    expect(item.productId).toBeNull();
    expect(item.subtotal).toBe(120);
    expect(item.createdAt).toBeInstanceOf(Date);
    expect(item.updatedAt).toBeInstanceOf(Date);
  });

  it('creates an item linked to a product with fractional quantity', () => {
    const item = WorkOrderItem.create({
      productId: 'product-id',
      quantity: 0.75,
      unitPrice: 40,
    });

    expect(item.productId).toBe('product-id');
    expect(item.serviceId).toBeNull();
    expect(item.subtotal).toBe(30);
  });

  it('rejects items without a catalog reference', () => {
    expect(() => WorkOrderItem.create({ quantity: 1, unitPrice: 10 })).toThrow(
      InvalidWorkOrderItemError,
    );
  });

  it('rejects items linked to both a service and a product', () => {
    expect(() =>
      WorkOrderItem.create({
        serviceId: 'repair-id',
        productId: 'product-id',
        quantity: 1,
        unitPrice: 10,
      }),
    ).toThrow(InvalidWorkOrderItemError);
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid quantity %s',
    (quantity) => {
      expect(() =>
        WorkOrderItem.create({
          productId: 'product-id',
          quantity,
          unitPrice: 10,
        }),
      ).toThrow(InvalidWorkOrderItemError);
    },
  );

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid unit price %s',
    (unitPrice) => {
      expect(() =>
        WorkOrderItem.create({
          productId: 'product-id',
          quantity: 1,
          unitPrice,
        }),
      ).toThrow(InvalidWorkOrderItemError);
    },
  );

  it('accepts a zero unit price', () => {
    const item = WorkOrderItem.create({
      serviceId: 'repair-id',
      quantity: 1,
      unitPrice: 0,
    });

    expect(item.subtotal).toBe(0);
  });

  it('rejects a quantity and price whose subtotal overflows', () => {
    expect(() =>
      WorkOrderItem.create({
        productId: 'product-id',
        quantity: Number.MAX_VALUE,
        unitPrice: 2,
      }),
    ).toThrow(InvalidWorkOrderItemError);
  });
});
