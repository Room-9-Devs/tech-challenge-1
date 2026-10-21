import { Injectable, Inject } from '@nestjs/common';
import { EventType } from '@/domain/entities/event-type.entity';
import { EventTypeRepository, EVENT_TYPE_REPOSITORY } from '@/domain/repositories/event-type.repository';
import { EventEntityType, isEventEntityType } from '@/domain/types/entity-reference.type';
import { EventTypeNotFoundError } from '@/domain/errors/event-type-not-found.error';
import { InvalidEventTypeError } from '@/domain/errors/invalid-event-type.error';
import { UpdateEventTypeInputDto } from './update-event-type-input.dto';
import { UpdateEventTypeOutputDto } from './update-event-type-output.dto';

@Injectable()
export class UpdateEventTypeUseCase {
  constructor(
    @Inject(EVENT_TYPE_REPOSITORY)
    private readonly eventTypeRepository: EventTypeRepository,
  ) {}

  async execute(input: UpdateEventTypeInputDto): Promise<UpdateEventTypeOutputDto> {
    const existing = await this.eventTypeRepository.findById(input.id);
    if (!existing) {
      throw new EventTypeNotFoundError(input.id);
    }

    let allowedEntityTypes: EventEntityType[];
    if (input.allowedEntityTypes) {
      allowedEntityTypes = [];
      for (const type of input.allowedEntityTypes) {
        if (!isEventEntityType(type)) {
          throw new InvalidEventTypeError(`Tipo de entidade inválido: ${type}`);
        }
        allowedEntityTypes.push(type);
      }
    } else {
      allowedEntityTypes = existing.allowedEntityTypes;
    }

    const updated = EventType.reconstitute({
      id: existing.id,
      code: existing.code,
      name: input.name ?? existing.name,
      description: input.description !== undefined ? input.description : existing.description,
      allowedEntityTypes,
      createdAt: existing.createdAt,
    });

    const saved = await this.eventTypeRepository.save(updated);

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
