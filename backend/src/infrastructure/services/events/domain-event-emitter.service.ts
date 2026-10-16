import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';
import { DomainEvent } from '@/domain/events/domain-event';

export type DomainEventListener<T extends DomainEvent = DomainEvent> = (
  event: T,
) => void | Promise<void>;

@Injectable()
export class DomainEventEmitter {
  private readonly emitter = new EventEmitter2({ wildcard: true });

  async emit(event: DomainEvent): Promise<void> {
    const asyncEmitter = this.emitter as EventEmitter2 & {
      emitAsync(eventType: string, ...values: unknown[]): Promise<unknown[]>;
    };
    await asyncEmitter.emitAsync(event.eventType, event);
  }

  on<T extends DomainEvent>(
    eventType: string,
    listener: DomainEventListener<T>,
  ): void {
    this.emitter.on(
      eventType,
      listener as (event: DomainEvent) => void | Promise<void>,
    );
  }
}
