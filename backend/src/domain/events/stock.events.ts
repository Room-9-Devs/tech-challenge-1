import { DomainEvent } from './domain-event';

// Metadata compartilhada pelos eventos de reserva/consumo/liberação do fluxo
// de ordens de serviço: descreve o estado do estoque antes e depois da
// operação, sem depender de movimentações (o reserved é manipulado direto
// na tabela e apenas OUT gera movement).
export interface StockReservationEventMetadata {
  productId: string;
  quantity: number;
  workOrderId?: string;
  workOrderNumber?: string;
  reason?: string;
  reservedBefore?: number;
  reservedAfter?: number;
  availableBefore?: number;
  availableAfter?: number;
  [key: string]: unknown;
}

export class StockAdjustedEvent extends DomainEvent {
  readonly eventType = 'stock.adjusted';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: {
      productId: string;
      oldQuantity: number;
      newQuantity: number;
      reason?: string;
      movementId?: string;
      movementType?: string;
      quantity?: number;
    },
  ) {
    super();
  }
}

export class StockReservedEvent extends DomainEvent {
  readonly eventType = 'stock.reserved';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: StockReservationEventMetadata,
  ) {
    super();
  }
}

export class StockConsumedEvent extends DomainEvent {
  readonly eventType = 'stock.consumed';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: StockReservationEventMetadata,
  ) {
    super();
  }
}

export class StockReleasedEvent extends DomainEvent {
  readonly eventType = 'stock.released';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: StockReservationEventMetadata,
  ) {
    super();
  }
}
