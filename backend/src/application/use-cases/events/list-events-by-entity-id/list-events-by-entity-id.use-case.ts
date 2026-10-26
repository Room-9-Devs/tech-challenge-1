import { Injectable, Inject } from '@nestjs/common';
import { EventRepository, EVENT_REPOSITORY } from '@/domain/repositories/event.repository';
import { EventTypeRepository, EVENT_TYPE_REPOSITORY } from '@/domain/repositories/event-type.repository';
import { ListEventsByEntityIdInputDto } from './list-events-by-entity-id-input.dto';
import { ListEventsByEntityIdOutputDto } from './list-events-by-entity-id-output.dto';

@Injectable()
export class ListEventsByEntityIdUseCase {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: EventRepository,
    @Inject(EVENT_TYPE_REPOSITORY)
    private readonly eventTypeRepository: EventTypeRepository,
  ) {}

  async execute(input: ListEventsByEntityIdInputDto): Promise<ListEventsByEntityIdOutputDto[]> {
    const events = await this.eventRepository.findByEntity(input.entityType, input.entityId);

    const eventTypeMap = new Map<string, string>();
    for (const event of events) {
      if (!eventTypeMap.has(event.eventTypeId)) {
        const eventType = await this.eventTypeRepository.findById(event.eventTypeId);
        eventTypeMap.set(event.eventTypeId, eventType?.code ?? '');
      }
    }

    return events.map((event) => ({
      id: event.id,
      eventTypeId: event.eventTypeId,
      eventTypeCode: eventTypeMap.get(event.eventTypeId) ?? '',
      entityType: event.entityType,
      entityId: event.entityId,
      note: event.note,
      metadata: event.metadata,
      createdBy: event.createdBy,
      createdAt: event.createdAt,
    }));
  }
}
