import { DomainEvent } from '@/domain/events/domain-event';

export const DOMAIN_EVENT_PUBLISHER = Symbol('DOMAIN_EVENT_PUBLISHER');

export interface DomainEventPublisher {
  publish(event: DomainEvent): Promise<void>;
}
