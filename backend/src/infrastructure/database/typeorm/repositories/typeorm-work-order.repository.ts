import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkOrder } from '@/domain/entities/work-order.entity';
import {
  WorkOrderQuery,
  WorkOrderRepository,
} from '@/domain/repositories/work-order.repository';
import { applyPagination } from '@/shared/pagination/typeorm-pagination.helper';
import { PaginatedOutput } from '@/shared/pagination/pagination.types';
import { WorkOrderOrmEntity } from '../entities/work-order.orm-entity';
import { WorkOrderItemOrmEntity } from '../entities/work-order-item.orm-entity';
import { WorkOrderMapper } from '../mappers/work-order.mapper';

@Injectable()
export class TypeOrmWorkOrderRepository implements WorkOrderRepository {
  constructor(
    @InjectRepository(WorkOrderOrmEntity)
    private readonly repository: Repository<WorkOrderOrmEntity>,
    @InjectRepository(WorkOrderItemOrmEntity)
    private readonly itemRepository: Repository<WorkOrderItemOrmEntity>,
  ) {}

  async save(workOrder: WorkOrder): Promise<WorkOrder> {
    const saved = await this.repository.save(
      WorkOrderMapper.toPersistence(workOrder),
    );
    const withItems = await this.repository.findOne({
      where: { id: saved.id },
      relations: { items: true },
    });
    return WorkOrderMapper.toDomain(withItems ?? saved);
  }

  async findById(id: string): Promise<WorkOrder | null> {
    const inTransaction = this.repository.queryRunner?.isTransactionActive;
    const ormEntity = inTransaction
      ? await this.repository.findOne({
          where: { id },
          lock: { mode: 'pessimistic_write' },
        })
      : await this.repository.findOne({
          where: { id },
          relations: { items: true },
        });
    if (ormEntity && inTransaction) {
      ormEntity.items = await this.itemRepository.find({
        where: { workOrderId: id },
      });
    }
    return ormEntity ? WorkOrderMapper.toDomain(ormEntity) : null;
  }

  async findAll(query: WorkOrderQuery): Promise<PaginatedOutput<WorkOrder>> {
    const { filters, clientId, search, ...pagination } = query;
    const queryBuilder = this.repository
      .createQueryBuilder('workOrder')
      .leftJoin('workOrder.vehicle', 'vehicle');

    if (clientId) {
      queryBuilder.andWhere('workOrder.clientId = :clientId', { clientId });
    }

    for (const [key, value] of Object.entries(filters ?? {})) {
      if (key === 'status' || key === 'vehicleId') {
        queryBuilder.andWhere(`workOrder.${key} = :filter_${key}`, {
          [`filter_${key}`]: value,
        });
      }
    }

    if (search?.trim()) {
      queryBuilder.andWhere(
        '(workOrder.number ILIKE :search OR vehicle.licensePlate ILIKE :search)',
        { search: `%${search.trim()}%` },
      );
    }

    applyPagination(queryBuilder, pagination, {
      alias: 'workOrder',
      searchColumns: [],
      allowedSortColumns: [
        'number',
        'status',
        'totalPrice',
        'createdAt',
        'updatedAt',
      ],
    });

    const [entities, totalItems] = await queryBuilder
      .leftJoinAndSelect('workOrder.items', 'items')
      .getManyAndCount();

    return {
      data: entities.map((entity) => WorkOrderMapper.toDomain(entity)),
      meta: {
        page: pagination.page,
        limit: pagination.limit,
        totalItems,
        totalPages: Math.ceil(totalItems / pagination.limit) || 1,
      },
    };
  }

  async deleteItem(workOrderId: string, itemId: string): Promise<void> {
    await this.itemRepository.delete({ id: itemId, workOrderId });
  }
}
