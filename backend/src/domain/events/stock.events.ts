import { DomainEvent } from './domain-event';

export class StockAdjustedEvent extends DomainEvent {
  readonly eventType = 'stock.adjusted';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: { productId: string; oldQuantity: number; newQuantity: number; reason?: string },
  ) {
    super();
  }
}

export class StockReservedEvent extends DomainEvent {
  readonly eventType = 'stock.reserved';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: { productId: string; quantity: number; reason?: string },
  ) {
    super();
  }
}

export class StockReleasedEvent extends DomainEvent {
  readonly eventType = 'stock.released';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: { productId: string; quantity: number; reason?: string },
  ) {
    super();
  }
}
