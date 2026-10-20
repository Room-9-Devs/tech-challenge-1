import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from 'eventemitter2';
import { DomainEvent } from '@/domain/events/domain-event';

export type DomainEventListener<T extends DomainEvent = DomainEvent> = (
  event: T,
) => void | Promise<void>;

@Injectable()
export class DomainEventEmitter {
  private readonly emitter = new EventEmitter2({ wildcard: true });
  private readonly logger = new Logger(DomainEventEmitter.name);

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
      async (event: DomainEvent) => {
        try {
          await (listener as (event: DomainEvent) => void | Promise<void>)(
            event,
          );
        } catch (error) {
          this.logger.error(
            `Falha ao processar o evento ${eventType}`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      },
    );
  }
}
