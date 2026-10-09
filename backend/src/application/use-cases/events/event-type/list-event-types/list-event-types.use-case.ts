import { Injectable, Inject } from '@nestjs/common';
import { EventTypeRepository, EVENT_TYPE_REPOSITORY } from '@/domain/repositories/event-type.repository';
import { ListEventTypesOutputDto } from './list-event-types-output.dto';

@Injectable()
export class ListEventTypesUseCase {
  constructor(
    @Inject(EVENT_TYPE_REPOSITORY)
    private readonly eventTypeRepository: EventTypeRepository,
  ) {}

  async execute(): Promise<ListEventTypesOutputDto[]> {
    const eventTypes = await this.eventTypeRepository.findAll();
    return eventTypes.map((eventType) => ({
      id: eventType.id,
      code: eventType.code,
      name: eventType.name,
      description: eventType.description,
      allowedEntityTypes: eventType.allowedEntityTypes,
      createdAt: eventType.createdAt,
    }));
  }
}
