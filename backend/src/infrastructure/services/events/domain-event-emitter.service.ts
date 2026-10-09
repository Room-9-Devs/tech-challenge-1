import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';
import { DomainEvent } from '@/domain/events/domain-event';

export type DomainEventListener<T extends DomainEvent = DomainEvent> = (event: T) => void | Promise<void>;

@Injectable()
export class DomainEventEmitter {
  private readonly emitter = new EventEmitter2({ wildcard: true });

  emit(event: DomainEvent): void {
    this.emitter.emit(event.eventType, event);
  }

  on<T extends DomainEvent>(eventType: string, listener: DomainEventListener<T>): void {
    this.emitter.on(eventType, listener as (event: DomainEvent) => void | Promise<void>);
  }
}
