import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { EventType } from '@/domain/entities/event-type.entity';
import { EventTypeRepository } from '@/domain/repositories/event-type.repository';
import { EventTypeAlreadyExistsError } from '@/domain/errors/event-type-already-exists.error';
import { EventTypeOrmEntity } from '../entities/event-type.orm-entity';
import { EventTypeMapper } from '../mappers/event-type.mapper';

@Injectable()
export class TypeOrmEventTypeRepository implements EventTypeRepository {
  constructor(
    @InjectRepository(EventTypeOrmEntity)
    private readonly repository: Repository<EventTypeOrmEntity>,
  ) {}

  async save(eventType: EventType): Promise<EventType> {
    const ormEntity = EventTypeMapper.toPersistence(eventType);
    try {
      const saved = await this.repository.save(ormEntity);
      return EventTypeMapper.toDomain(saved);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        (error as QueryFailedError & { driverError?: { code?: string } }).driverError?.code === '23505'
      ) {
        throw new EventTypeAlreadyExistsError(eventType.code);
      }
      throw error;
    }
  }

  async findById(id: string): Promise<EventType | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? EventTypeMapper.toDomain(ormEntity) : null;
  }

  async findByCode(code: string): Promise<EventType | null> {
    const ormEntity = await this.repository.findOne({ where: { code } });
    return ormEntity ? EventTypeMapper.toDomain(ormEntity) : null;
  }

  async findAll(): Promise<EventType[]> {
    const ormEntities = await this.repository.find({ order: { code: 'ASC' } });
    return ormEntities.map((entity) => EventTypeMapper.toDomain(entity));
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
