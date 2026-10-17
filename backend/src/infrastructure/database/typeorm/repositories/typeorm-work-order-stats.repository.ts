import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import {
  WorkOrderStatsRecord,
  WorkOrderStatsRepository,
  WorkOrderStatusTransition,
} from '@/application/ports/work-order-stats.repository';
import { WorkOrderOrmEntity } from '../entities/work-order.orm-entity';
import { EventOrmEntity } from '../entities/event.orm-entity';
import { EventTypeOrmEntity } from '../entities/event-type.orm-entity';

const WORK_ORDER_STATUS_CHANGED_CODE = 'work_order.status_changed';

@Injectable()
export class TypeOrmWorkOrderStatsRepository implements WorkOrderStatsRepository {
  constructor(
    @InjectRepository(WorkOrderOrmEntity)
    private readonly workOrders: Repository<WorkOrderOrmEntity>,
    @InjectRepository(EventOrmEntity)
    private readonly events: Repository<EventOrmEntity>,
    @InjectRepository(EventTypeOrmEntity)
    private readonly eventTypes: Repository<EventTypeOrmEntity>,
  ) {}

  async findRecordsCreatedUntil(until: Date): Promise<WorkOrderStatsRecord[]> {
    const createdOrders = await this.workOrders
      .createQueryBuilder('wo')
      .select(['wo.id AS id', 'wo.createdAt AS "createdAt"'])
      .where('wo.createdAt <= :until', { until })
      .getRawMany<{ id: string; createdAt: Date }>();

    const records = new Map<string, WorkOrderStatsRecord>(
      createdOrders.map((row) => [
        row.id,
        { id: row.id, createdAt: new Date(row.createdAt), transitions: [] },
      ]),
    );
    if (records.size === 0) return [];

    const statusChangedType = await this.eventTypes.findOne({
      where: { code: WORK_ORDER_STATUS_CHANGED_CODE },
    });
    if (!statusChangedType) return [...records.values()];

    const statusEvents = await this.events
      .createQueryBuilder('event')
      .select([
        'event.entityId AS "entityId"',
        'event.createdAt AS "createdAt"',
        "event.metadata->>'to' AS status",
      ])
      .where('event.eventTypeId = :eventTypeId', {
        eventTypeId: statusChangedType.id,
      })
      .andWhere('event.entityType = :entityType', {
        entityType: 'work_order',
      })
      .andWhere('event.createdAt <= :until', { until })
      .andWhere('event.entityId IN (:...ids)', {
        ids: [...records.keys()],
      })
      .orderBy('event.createdAt', 'ASC')
      .getRawMany<{ entityId: string; createdAt: Date; status: string }>();

    for (const row of statusEvents) {
      const record = records.get(row.entityId);
      if (!record) continue;
      if (
        !Object.values(WorkOrderStatus).includes(row.status as WorkOrderStatus)
      ) {
        continue;
      }
      const transition: WorkOrderStatusTransition = {
        status: row.status as WorkOrderStatus,
        at: new Date(row.createdAt),
      };
      record.transitions.push(transition);
    }

    return [...records.values()];
  }
}
