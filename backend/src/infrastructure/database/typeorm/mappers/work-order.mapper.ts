import { WorkOrder } from '@/domain/entities/work-order.entity';
import { WorkOrderItem } from '@/domain/entities/work-order-item.entity';
import { WorkOrderOrmEntity } from '../entities/work-order.orm-entity';
import { WorkOrderItemOrmEntity } from '../entities/work-order-item.orm-entity';

export class WorkOrderMapper {
  static toDomain(ormEntity: WorkOrderOrmEntity): WorkOrder {
    return WorkOrder.reconstitute({
      id: ormEntity.id,
      number: ormEntity.number,
      status: ormEntity.status,
      vehicleId: ormEntity.vehicleId,
      clientId: ormEntity.clientId,
      createdBy: ormEntity.createdBy,
      observations: ormEntity.observations,
      items: (ormEntity.items ?? []).map((item) =>
        WorkOrderItem.reconstitute({
          id: item.id,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          serviceId: item.serviceId,
          productId: item.productId,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }),
      ),
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(domainEntity: WorkOrder): WorkOrderOrmEntity {
    const ormEntity = new WorkOrderOrmEntity();
    ormEntity.id = domainEntity.id;
    ormEntity.number = domainEntity.number;
    ormEntity.status = domainEntity.status;
    ormEntity.vehicleId = domainEntity.vehicleId;
    ormEntity.clientId = domainEntity.clientId;
    ormEntity.createdBy = domainEntity.createdBy;
    ormEntity.observations = domainEntity.observations;
    ormEntity.totalPrice = domainEntity.totalPrice;
    ormEntity.items = domainEntity.items.map((item) => {
      const itemEntity = new WorkOrderItemOrmEntity();
      itemEntity.id = item.id;
      itemEntity.workOrderId = domainEntity.id;
      itemEntity.quantity = item.quantity;
      itemEntity.unitPrice = item.unitPrice;
      itemEntity.serviceId = item.serviceId;
      itemEntity.productId = item.productId;
      itemEntity.createdAt = item.createdAt;
      itemEntity.updatedAt = item.updatedAt;
      return itemEntity;
    });
    ormEntity.createdAt = domainEntity.createdAt;
    ormEntity.updatedAt = domainEntity.updatedAt;
    return ormEntity;
  }
}
