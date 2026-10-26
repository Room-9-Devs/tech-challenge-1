import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '@/domain/entities/event.entity';
import { EventRepository } from '@/domain/repositories/event.repository';
import { EventEntityType } from '@/domain/types/entity-reference.type';
import { EventOrmEntity } from '../entities/event.orm-entity';
import { EventMapper } from '../mappers/event.mapper';

@Injectable()
export class TypeOrmEventRepository implements EventRepository {
  constructor(
    @InjectRepository(EventOrmEntity)
    private readonly repository: Repository<EventOrmEntity>,
  ) {}

  async save(event: Event): Promise<Event> {
    const ormEntity = EventMapper.toPersistence(event);
    const saved = await this.repository.save(ormEntity);
    return EventMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Event | null> {
    const ormEntity = await this.repository.findOne({
      where: { id },
      relations: ['eventType'],
    });
    return ormEntity ? EventMapper.toDomain(ormEntity) : null;
  }

  async findByEntity(entityType: EventEntityType, entityId: string): Promise<Event[]> {
    const ormEntities = await this.repository.find({
      where: { entityType, entityId },
      relations: ['eventType'],
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map((entity) => EventMapper.toDomain(entity));
  }

  async findByEventType(eventTypeId: string): Promise<Event[]> {
    const ormEntities = await this.repository.find({
      where: { eventTypeId },
      relations: ['eventType'],
      order: { createdAt: 'DESC' },
    });
    return ormEntities.map((entity) => EventMapper.toDomain(entity));
  }
}
