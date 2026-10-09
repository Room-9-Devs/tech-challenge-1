import { DomainEventPublisher } from '@/application/ports/domain-event-publisher.port';
import { DomainEvent } from '@/domain/events/domain-event';

export class FakeDomainEventPublisher implements DomainEventPublisher {
  private readonly publishedEvents: DomainEvent[] = [];

  async publish(event: DomainEvent): Promise<void> {
    this.publishedEvents.push(event);
  }

  getPublishedEvents(): DomainEvent[] {
    return this.publishedEvents;
  }

  clear(): void {
    this.publishedEvents.length = 0;
  }
}
