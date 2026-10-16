import { ConflictException } from '@nestjs/common';
import { Stock } from '@/domain/entities/stock.entity';
import { StockMovementType } from '@/domain/entities/stock-movement.entity';
import { WorkOrder } from '@/domain/entities/work-order.entity';
import { WorkOrderItem } from '@/domain/entities/work-order-item.entity';
import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import {
  EventType,
} from '@/domain/entities/event-type.entity';
import {
  finishWorkOrderReservation,
  reserveWorkOrderProducts,
} from '@/application/use-cases/work-orders/work-order-transaction.helpers';
import { WorkOrderRepositories } from '@/application/ports/work-order-unit-of-work.port';

describe('Work order stock reservation helpers', () => {
  const actorId = 'actor-id';
  const username = 'staff';
  const productId = 'product-id';

  let stock: Stock;
  let movements: any[];
  let events: any[];

  function makeRepositories(
    stocksById: Map<string, Stock>,
  ): WorkOrderRepositories {
    return {
      workOrders: {} as any,
      products: {} as any,
      repairs: {} as any,
      stocks: {
        findByProductId: jest.fn(async (id: string) => stocksById.get(id) ?? null),
        save: jest.fn(async (saved: Stock) => {
          stocksById.set(saved.productId, saved);
          return saved;
        }),
      } as any,
      stockMovements: {
        save: jest.fn(async (movement: any) => {
          movements.push(movement);
          return movement;
        }),
      } as any,
      events: {
        save: jest.fn(async (event: any) => {
          events.push(event);
          return event;
        }),
      } as any,
      eventTypes: {
        findByCode: jest.fn(async (code: string) =>
          EventType.create({
            code,
            name: code,
            allowedEntityTypes: ['stock'],
          }),
        ),
      } as any,
    };
  }

  function makeOrder(products: Array<[string, number]>): WorkOrder {
    return WorkOrder.create({
      number: 'OS-0001/2026',
      vehicleId: 'vehicle-id',
      clientId: 'client-id',
      createdBy: 'creator-id',
      items: products.map(([pid, qty]) =>
        WorkOrderItem.create({
          productId: pid,
          quantity: qty,
          unitPrice: 10,
        }),
      ),
    });
  }

  beforeEach(() => {
    movements = [];
    events = [];
    stock = Stock.reconstitute({
      id: 'stock-id',
      productId,
      quantity: 10,
      reserved: 0,
    });
  });

  describe('reserveWorkOrderProducts', () => {
    it('increments reserved directly on stock and records the event without a movement', async () => {
      const repositories = makeRepositories(new Map([[productId, stock]]));
      const order = makeOrder([[productId, 3]]);

      await reserveWorkOrderProducts(repositories, order, username);

      expect(stock.quantity).toBe(10);
      expect(stock.reserved).toBe(3);
      expect(stock.available).toBe(7);
      expect(repositories.stocks.save).toHaveBeenCalledWith(stock);
      expect(repositories.stockMovements.save).not.toHaveBeenCalled();

      expect(events).toHaveLength(1);
      const event = events[0];
      expect(event.entityType).toBe('stock');
      expect(event.entityId).toBe('stock-id');
      expect(event.metadata).toEqual({
        workOrderId: order.id,
        workOrderNumber: 'OS-0001/2026',
        productId,
        quantity: 3,
        reservedBefore: 0,
        reservedAfter: 3,
        availableBefore: 10,
        availableAfter: 7,
      });
    });

    it('rejects reserving more than the available balance and records no event', async () => {
      const repositories = makeRepositories(new Map([[productId, stock]]));
      const order = makeOrder([[productId, 11]]);

      await expect(
        reserveWorkOrderProducts(repositories, order, username),
      ).rejects.toThrow('Estoque insuficiente');
      expect(stock.reserved).toBe(0);
      expect(events).toHaveLength(0);
      expect(repositories.stockMovements.save).not.toHaveBeenCalled();
    });

    it('fails when the product has no stock registered', async () => {
      const repositories = makeRepositories(new Map());
      const order = makeOrder([[productId, 1]]);

      await expect(
        reserveWorkOrderProducts(repositories, order, username),
      ).rejects.toThrow(ConflictException);
      expect(events).toHaveLength(0);
    });
  });

  describe('finishWorkOrderReservation', () => {
    function repositoriesWithStock(): WorkOrderRepositories {
      return makeRepositories(new Map([[productId, stock]]));
    }

    it('on approval consumes the reservation, records an OUT movement and the consumed event', async () => {
      const order = makeOrder([[productId, 4]]);
      await reserveWorkOrderProducts(repositoriesWithStock(), order, username);

      movements = [];
      events = [];
      const repositories = repositoriesWithStock();

      await finishWorkOrderReservation(
        repositories,
        order,
        WorkOrderStatus.APPROVED,
        actorId,
        username,
      );

      expect(stock.reserved).toBe(0);
      expect(stock.quantity).toBe(6);
      expect(stock.available).toBe(6);

      expect(movements).toHaveLength(1);
      const movement = movements[0];
      expect(movement.movementType).toBe(StockMovementType.OUT);
      expect(movement.quantity).toBe(4);
      expect(movement.previousQuantity).toBe(10);
      expect(movement.referenceType).toBe('work_order');
      expect(movement.referenceId).toBe(order.id);
      expect(movement.createdBy).toBe(actorId);

      expect(events).toHaveLength(1);
      expect(events[0].metadata).toEqual(
        expect.objectContaining({
          productId,
          quantity: 4,
          reservedBefore: 4,
          reservedAfter: 0,
          availableBefore: 6,
          availableAfter: 6,
          workOrderNumber: 'OS-0001/2026',
        }),
      );
    });

    it('on cancellation releases the reservation without recording any movement', async () => {
      const order = makeOrder([[productId, 4]]);
      await reserveWorkOrderProducts(repositoriesWithStock(), order, username);

      movements = [];
      events = [];
      const repositories = repositoriesWithStock();

      await finishWorkOrderReservation(
        repositories,
        order,
        WorkOrderStatus.CANCELLED,
        actorId,
        username,
      );

      expect(stock.reserved).toBe(0);
      expect(stock.quantity).toBe(10);
      expect(stock.available).toBe(10);
      expect(repositories.stockMovements.save).not.toHaveBeenCalled();

      expect(events).toHaveLength(1);
      expect(events[0].metadata).toEqual(
        expect.objectContaining({
          productId,
          quantity: 4,
          reservedBefore: 4,
          reservedAfter: 0,
          availableBefore: 6,
          availableAfter: 10,
        }),
      );
    });

    it('fails when the product has no stock registered during the finish step', async () => {
      const order = makeOrder([[productId, 4]]);
      await reserveWorkOrderProducts(
        makeRepositories(new Map([[productId, stock]])),
        order,
        username,
      );

      movements = [];
      events = [];
      const repositories = makeRepositories(new Map());

      await expect(
        finishWorkOrderReservation(
          repositories,
          order,
          WorkOrderStatus.APPROVED,
          actorId,
          username,
        ),
      ).rejects.toThrow(ConflictException);
      expect(events).toHaveLength(0);
    });
  });
});
