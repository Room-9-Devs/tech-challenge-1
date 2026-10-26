import { DomainEvent } from '@/domain/events/domain-event';

export const DOMAIN_EVENT_SUBSCRIBER = Symbol('DOMAIN_EVENT_SUBSCRIBER');

export type DomainEventListener<T extends DomainEvent = DomainEvent> = (
  event: T,
) => void | Promise<void>;

export interface DomainEventSubscriber {
  on<T extends DomainEvent>(
    eventType: string,
    listener: DomainEventListener<T>,
  ): void;
}
