import { Injectable, Inject } from '@nestjs/common';
import { EventType } from '@/domain/entities/event-type.entity';
import { EventTypeRepository, EVENT_TYPE_REPOSITORY } from '@/domain/repositories/event-type.repository';
import { EventEntityType, isEventEntityType } from '@/domain/types/entity-reference.type';
import { InvalidEventTypeError } from '@/domain/errors/invalid-event-type.error';
import { CreateEventTypeInputDto } from './create-event-type-input.dto';
import { CreateEventTypeOutputDto } from './create-event-type-output.dto';

@Injectable()
export class CreateEventTypeUseCase {
  constructor(
    @Inject(EVENT_TYPE_REPOSITORY)
    private readonly eventTypeRepository: EventTypeRepository,
  ) {}

  async execute(input: CreateEventTypeInputDto): Promise<CreateEventTypeOutputDto> {
    const allowedEntityTypes: EventEntityType[] = [];
    for (const type of input.allowedEntityTypes ?? []) {
      if (!isEventEntityType(type)) {
        throw new InvalidEventTypeError(`Invalid entity type: ${type}`);
      }
      allowedEntityTypes.push(type);
    }

    const eventType = EventType.create({
      code: input.code,
      name: input.name,
      description: input.description ?? null,
      allowedEntityTypes,
    });

    const saved = await this.eventTypeRepository.save(eventType);

    return {
      id: saved.id,
      code: saved.code,
      name: saved.name,
      description: saved.description,
      allowedEntityTypes: saved.allowedEntityTypes,
      createdAt: saved.createdAt,
    };
  }
}
