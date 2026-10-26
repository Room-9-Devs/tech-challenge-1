import { WorkOrderConflictError } from '@/domain/errors/work-order-conflict.error';
import { WorkOrderNotFoundError } from '@/domain/errors/work-order-not-found.error';
import { Event } from '@/domain/entities/event.entity';
import {
  StockMovement,
  StockMovementType,
} from '@/domain/entities/stock-movement.entity';
import { WorkOrder } from '@/domain/entities/work-order.entity';
import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import { WorkOrderRepositories } from '@/application/ports/work-order-unit-of-work.port';

// Estado do estoque antes da operação, usado para auditoria nos eventos.
interface StockSnapshot {
  reservedBefore: number;
  availableBefore: number;
}

function stockSnapshot(stock: { reserved: number; available: number }): StockSnapshot {
  return {
    reservedBefore: stock.reserved,
    availableBefore: stock.available,
  };
}

export async function requireWorkOrder(
  repositories: WorkOrderRepositories,
  id: string,
): Promise<WorkOrder> {
  const order = await repositories.workOrders.findById(id);
  if (!order) throw new WorkOrderNotFoundError(id);
  return order;
}

function productQuantities(order: WorkOrder): Map<string, number> {
  const quantities = new Map<string, number>();
  for (const item of order.items) {
    if (item.productId)
      quantities.set(
        item.productId,
        (quantities.get(item.productId) ?? 0) + item.quantity,
      );
  }
  return new Map(
    [...quantities.entries()].sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  );
}

async function recordStockEvent(
  repositories: WorkOrderRepositories,
  code: string,
  stockId: string,
  username: string | undefined,
  note: string,
  metadata: Record<string, unknown>,
): Promise<void> {
  const type = await repositories.eventTypes.findByCode(code);
  if (!type)
    throw new WorkOrderConflictError(`Tipo de evento ${code} não cadastrado`);
  await repositories.events.save(
    Event.create({
      eventTypeId: type.id,
      entityType: 'stock',
      entityId: stockId,
      createdBy: username ?? null,
      note,
      metadata,
    }),
  );
}

export async function reserveWorkOrderProducts(
  repositories: WorkOrderRepositories,
  order: WorkOrder,
  username?: string,
): Promise<void> {
  for (const [productId, quantity] of productQuantities(order)) {
    const stock = await repositories.stocks.findByProductId(productId);
    if (!stock)
      throw new WorkOrderConflictError('Estoque do produto não encontrado');
    const snapshot = stockSnapshot(stock);
    stock.reserve(quantity);
    await repositories.stocks.save(stock);
    await recordStockEvent(
      repositories,
      'stock.reserved',
      stock.id,
      username,
      `Reserva para OS ${order.number}`,
      {
        workOrderId: order.id,
        workOrderNumber: order.number,
        productId,
        quantity,
        reservedBefore: snapshot.reservedBefore,
        reservedAfter: stock.reserved,
        availableBefore: snapshot.availableBefore,
        availableAfter: stock.available,
      },
    );
  }
}

export async function finishWorkOrderReservation(
  repositories: WorkOrderRepositories,
  order: WorkOrder,
  status: WorkOrderStatus.APPROVED | WorkOrderStatus.CANCELLED,
  actorId: string,
  username?: string,
): Promise<void> {
  for (const [productId, quantity] of productQuantities(order)) {
    const stock = await repositories.stocks.findByProductId(productId);
    if (!stock)
      throw new WorkOrderConflictError('Estoque do produto não encontrado');
    const snapshot = stockSnapshot(stock);
    const finishEvent = (code: 'stock.consumed' | 'stock.released', note: string) =>
      recordStockEvent(repositories, code, stock.id, username, note, {
        workOrderId: order.id,
        workOrderNumber: order.number,
        productId,
        quantity,
        reservedBefore: snapshot.reservedBefore,
        reservedAfter: stock.reserved,
        availableBefore: snapshot.availableBefore,
        availableAfter: stock.available,
      });
    if (status === WorkOrderStatus.CANCELLED) {
      stock.releaseReservation(quantity);
      await finishEvent(
        'stock.released',
        `Liberação da reserva da OS ${order.number}`,
      );
    } else {
      const previousQuantity = stock.quantity;
      stock.consumeReservation(quantity);
      await repositories.stockMovements.save(
        StockMovement.create({
          productId,
          quantity,
          previousQuantity,
          movementType: StockMovementType.OUT,
          description: `Consumo da OS ${order.number}`,
          referenceType: 'work_order',
          referenceId: order.id,
          createdBy: actorId,
        }),
      );
      await finishEvent('stock.consumed', `Consumo da OS ${order.number}`);
    }
    await repositories.stocks.save(stock);
  }
}
