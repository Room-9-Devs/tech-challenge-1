import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  WorkOrderRepositories,
  WorkOrderUnitOfWork,
} from '@/application/ports/work-order-unit-of-work.port';
import { TypeOrmWorkOrderRepository } from './repositories/typeorm-work-order.repository';
import { TypeOrmProductRepository } from './repositories/typeorm-product.repository';
import { TypeOrmRepairRepository } from './repositories/typeorm-repair.repository';
import { TypeOrmStockRepository } from './repositories/typeorm-stock.repository';
import { TypeOrmStockMovementRepository } from './repositories/typeorm-stock-movement.repository';
import { TypeOrmEventRepository } from './repositories/typeorm-event.repository';
import { TypeOrmEventTypeRepository } from './repositories/typeorm-event-type.repository';
import { WorkOrderOrmEntity } from './entities/work-order.orm-entity';
import { WorkOrderItemOrmEntity } from './entities/work-order-item.orm-entity';
import { ProductOrmEntity } from './entities/product.orm-entity';
import { RepairOrmEntity } from './entities/repair.orm-entity';
import { StockOrmEntity } from './entities/stock.orm-entity';
import { StockMovementOrmEntity } from './entities/stock-movement.orm-entity';
import { EventOrmEntity } from './entities/event.orm-entity';
import { EventTypeOrmEntity } from './entities/event-type.orm-entity';

@Injectable()
export class TypeOrmWorkOrderUnitOfWork implements WorkOrderUnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  run<T>(
    work: (repositories: WorkOrderRepositories) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction((manager) =>
      work({
        workOrders: new TypeOrmWorkOrderRepository(
          manager.getRepository(WorkOrderOrmEntity),
          manager.getRepository(WorkOrderItemOrmEntity),
        ),
        products: new TypeOrmProductRepository(
          manager.getRepository(ProductOrmEntity),
        ),
        repairs: new TypeOrmRepairRepository(
          manager.getRepository(RepairOrmEntity),
        ),
        stocks: new TypeOrmStockRepository(
          manager.getRepository(StockOrmEntity),
        ),
        stockMovements: new TypeOrmStockMovementRepository(
          manager.getRepository(StockMovementOrmEntity),
        ),
        events: new TypeOrmEventRepository(
          manager.getRepository(EventOrmEntity),
        ),
        eventTypes: new TypeOrmEventTypeRepository(
          manager.getRepository(EventTypeOrmEntity),
        ),
      }),
    );
  }
}
