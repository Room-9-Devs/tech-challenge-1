import { EventRepository } from '@/domain/repositories/event.repository';
import { EventTypeRepository } from '@/domain/repositories/event-type.repository';
import { ProductRepository } from '@/domain/repositories/product.repository';
import { RepairRepository } from '@/domain/repositories/repair.repository';
import { StockRepository } from '@/domain/repositories/stock.repository';
import { StockMovementRepository } from '@/domain/repositories/stock-movement.repository';
import { WorkOrderRepository } from '@/domain/repositories/work-order.repository';

export const WORK_ORDER_UNIT_OF_WORK = Symbol('WORK_ORDER_UNIT_OF_WORK');

export interface WorkOrderRepositories {
  workOrders: WorkOrderRepository;
  products: ProductRepository;
  repairs: RepairRepository;
  stocks: StockRepository;
  stockMovements: StockMovementRepository;
  events: EventRepository;
  eventTypes: EventTypeRepository;
}

export interface WorkOrderUnitOfWork {
  run<T>(work: (repositories: WorkOrderRepositories) => Promise<T>): Promise<T>;
}
