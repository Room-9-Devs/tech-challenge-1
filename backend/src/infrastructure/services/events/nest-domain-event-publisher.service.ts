import { Injectable } from '@nestjs/common';
import { DomainEvent } from '@/domain/events/domain-event';
import { DomainEventPublisher } from '@/application/ports/domain-event-publisher.port';
import { DomainEventEmitter } from './domain-event-emitter.service';

@Injectable()
export class NestDomainEventPublisher implements DomainEventPublisher {
  constructor(private readonly domainEventEmitter: DomainEventEmitter) {}

  async publish(event: DomainEvent): Promise<void> {
    this.domainEventEmitter.emit(event);
  }
}
