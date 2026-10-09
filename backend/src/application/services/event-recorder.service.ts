import { Injectable, Inject } from '@nestjs/common';
import { Event } from '@/domain/entities/event.entity';
import { EventTypeRepository } from '@/domain/repositories/event-type.repository';
import { EventRepository } from '@/domain/repositories/event.repository';
import { EventTypeNotFoundError } from '@/domain/errors/event-type-not-found.error';
import { EventNotAllowedForEntityError } from '@/domain/errors/event-not-allowed-for-entity.error';
import {
  EventRecorder,
  RecordEventInput,
} from '@/application/ports/event-recorder.port';
import { EVENT_TYPE_REPOSITORY } from '@/domain/repositories/event-type.repository';
import { EVENT_REPOSITORY } from '@/domain/repositories/event.repository';

@Injectable()
export class EventRecorderService implements EventRecorder {
  constructor(
    @Inject(EVENT_TYPE_REPOSITORY)
    private readonly eventTypeRepository: EventTypeRepository,
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: EventRepository,
  ) {}

  async record(input: RecordEventInput): Promise<Event> {
    const eventType = await this.eventTypeRepository.findByCode(input.eventTypeCode);
    if (!eventType) {
      throw new EventTypeNotFoundError(input.eventTypeCode);
    }

    if (!eventType.allowsEntityType(input.entityType)) {
      throw new EventNotAllowedForEntityError(eventType.code, input.entityType);
    }

    const event = Event.create({
      eventTypeId: eventType.id,
      entityType: input.entityType,
      entityId: input.entityId,
      note: input.note ?? null,
      metadata: input.metadata ?? null,
      createdBy: input.createdBy ?? null,
    });

    return this.eventRepository.save(event);
  }
}
