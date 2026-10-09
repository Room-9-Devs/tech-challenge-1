import { DomainEvent } from './domain-event';
import { ProductType, ProductUnit } from '@/domain/entities/product.entity';

export class ProductCreatedEvent extends DomainEvent {
  readonly eventType = 'product.created';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: {
      sku: string;
      name: string;
      productType: ProductType;
      unit: ProductUnit;
      cost: number;
      salePrice: number;
    },
  ) {
    super();
  }
}

export class ProductUpdatedEvent extends DomainEvent {
  readonly eventType = 'product.updated';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: { changedFields: string[]; old: Record<string, unknown>; new: Record<string, unknown> },
  ) {
    super();
  }
}

export class ProductPriceChangedEvent extends DomainEvent {
  readonly eventType = 'product.price_changed';

  constructor(
    readonly entityId: string,
    readonly createdBy: string | undefined,
    readonly metadata: { oldCost: number; newCost: number; oldSalePrice: number; newSalePrice: number },
  ) {
    super();
  }
}
