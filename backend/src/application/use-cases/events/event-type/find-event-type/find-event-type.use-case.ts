import { Injectable, Inject } from '@nestjs/common';
import { EventTypeRepository, EVENT_TYPE_REPOSITORY } from '@/domain/repositories/event-type.repository';
import { EventTypeNotFoundError } from '@/domain/errors/event-type-not-found.error';
import { FindEventTypeOutputDto } from './find-event-type-output.dto';

@Injectable()
export class FindEventTypeUseCase {
  constructor(
    @Inject(EVENT_TYPE_REPOSITORY)
    private readonly eventTypeRepository: EventTypeRepository,
  ) {}

  async execute(id: string): Promise<FindEventTypeOutputDto> {
    const eventType = await this.eventTypeRepository.findById(id);
    if (!eventType) {
      throw new EventTypeNotFoundError(id);
    }

    return {
      id: eventType.id,
      code: eventType.code,
      name: eventType.name,
      description: eventType.description,
      allowedEntityTypes: eventType.allowedEntityTypes,
      createdAt: eventType.createdAt,
    };
  }
}
