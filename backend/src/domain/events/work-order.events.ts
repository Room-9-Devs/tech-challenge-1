import { DomainEvent } from './domain-event';
import { WorkOrderStatus } from '../entities/work-order-status.enum';

export class WorkOrderCreatedEvent extends DomainEvent {
  readonly eventType = 'work_order.created';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly note: string,
    readonly metadata: { number: string },
  ) {
    super();
  }
}

export class WorkOrderStatusChangedEvent extends DomainEvent {
  readonly eventType = 'work_order.status_changed';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly note: string,
    readonly metadata: {
      from: WorkOrderStatus;
      to: WorkOrderStatus;
      reason: string;
    },
  ) {
    super();
  }
}

export class WorkOrderPaymentConfirmedEvent extends DomainEvent {
  readonly eventType = 'work_order.payment_confirmed';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly note: string,
    readonly metadata: { kind: 'payment_confirmation' },
  ) {
    super();
  }
}

export interface WorkOrderItemEventMetadata extends Record<string, unknown> {
  itemId: string;
  itemType: 'service' | 'product';
  serviceId: string | null;
  productId: string | null;
  quantity: number;
  unitPrice: number;
}

export class WorkOrderItemAddedEvent extends DomainEvent {
  readonly eventType = 'work_order.item_added';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: WorkOrderItemEventMetadata,
  ) {
    super();
  }
}

export class WorkOrderItemQuantityChangedEvent extends DomainEvent {
  readonly eventType = 'work_order.item_quantity_changed';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: WorkOrderItemEventMetadata & {
      previousQuantity: number;
      newQuantity: number;
    },
  ) {
    super();
  }
}

export class WorkOrderItemRemovedEvent extends DomainEvent {
  readonly eventType = 'work_order.item_removed';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: WorkOrderItemEventMetadata,
  ) {
    super();
  }
}
