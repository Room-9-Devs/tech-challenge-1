import { Injectable, Inject } from '@nestjs/common';
import { EventRecorder, EVENT_RECORDER } from '@/application/ports/event-recorder.port';
import { RecordEventInputDto } from './record-event-input.dto';
import { RecordEventOutputDto } from './record-event-output.dto';
import { isEventEntityType } from '@/domain/types/entity-reference.type';
import { InvalidEventError } from '@/domain/errors/invalid-event.error';

@Injectable()
export class RecordEventUseCase {
  constructor(
    @Inject(EVENT_RECORDER)
    private readonly eventRecorder: EventRecorder,
  ) {}

  async execute(input: RecordEventInputDto): Promise<RecordEventOutputDto> {
    if (!isEventEntityType(input.entityType)) {
      throw new InvalidEventError(`Tipo de entidade inválido: ${input.entityType}`);
    }

    const event = await this.eventRecorder.record({
      eventTypeCode: input.eventTypeCode,
      entityType: input.entityType,
      entityId: input.entityId,
      note: input.note ?? null,
      metadata: input.metadata ?? null,
      createdBy: input.createdBy ?? null,
    });

    return {
      id: event.id,
      eventTypeId: event.eventTypeId,
      eventTypeCode: input.eventTypeCode,
      entityType: event.entityType,
      entityId: event.entityId,
      note: event.note,
      metadata: event.metadata,
      createdBy: event.createdBy,
      createdAt: event.createdAt,
    };
  }
}
