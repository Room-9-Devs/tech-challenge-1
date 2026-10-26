import { randomUUID } from 'crypto';
import { InsufficientStockError } from '../errors/insufficient-stock.error';
import { InvalidStockMovementError } from '../errors/invalid-stock-movement.error';
import { StockBelowReservedError } from '../errors/stock-below-reserved.error';
import {
  MAX_STOCK_QUANTITY,
  StockMovement,
  StockMovementType,
} from './stock-movement.entity';

export interface StockProps {
  id?: string;
  productId: string;
  quantity: number;
  reserved: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Stock {
  private readonly _id: string;
  private readonly _productId: string;
  private _quantity: number;
  private _reserved: number;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: StockProps) {
    this._id = props.id ?? randomUUID();
    this._productId = props.productId;
    this._quantity = props.quantity;
    this._reserved = props.reserved;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  public static create(props: { productId: string }): Stock {
    return new Stock({ productId: props.productId, quantity: 0, reserved: 0 });
  }

  public static reconstitute(props: StockProps): Stock {
    return new Stock(props);
  }

  get id(): string {
    return this._id;
  }

  get productId(): string {
    return this._productId;
  }

  get quantity(): number {
    return this._quantity;
  }

  get reserved(): number {
    return this._reserved;
  }

  get available(): number {
    return this._quantity - this._reserved;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  public hasBalance(): boolean {
    return this._quantity > 0 || this._reserved > 0;
  }

  public applyMovement(movement: StockMovement): void {
    if (movement.productId !== this._productId) {
      throw new InvalidStockMovementError(
        'A movimentação não pertence ao produto deste estoque',
      );
    }

    switch (movement.movementType) {
      case StockMovementType.IN:
        this.increase(movement.quantity);
        break;
      case StockMovementType.OUT:
        this.decrease(movement.quantity);
        break;
      case StockMovementType.ADJUSTMENT:
        this.adjust(movement.quantity);
        break;
    }

    this._updatedAt = new Date();
  }

  public reserve(quantity: number): void {
    this.validateReservationQuantity(quantity);
    if (quantity > this.available) {
      throw new InsufficientStockError(this._productId, this.available, quantity);
    }
    this._reserved += quantity;
    this._updatedAt = new Date();
  }

  public releaseReservation(quantity: number): void {
    this.validateReservationQuantity(quantity);
    if (quantity > this._reserved) {
      throw new InvalidStockMovementError(
        'A quantidade liberada não pode exceder o estoque reservado',
      );
    }
    this._reserved -= quantity;
    this._updatedAt = new Date();
  }

  public consumeReservation(quantity: number): void {
    this.validateReservationQuantity(quantity);
    if (quantity > this._reserved) {
      throw new InvalidStockMovementError(
        'A quantidade consumida não pode exceder o estoque reservado',
      );
    }
    this._reserved -= quantity;
    this._quantity -= quantity;
    this._updatedAt = new Date();
  }

  private validateReservationQuantity(quantity: number): void {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new InvalidStockMovementError(
        'A quantidade reservada deve ser um inteiro maior que zero',
      );
    }
  }

  private increase(quantity: number): void {
    if (this._quantity + quantity > MAX_STOCK_QUANTITY) {
      throw new InvalidStockMovementError(
        `A quantidade em estoque não pode ultrapassar ${MAX_STOCK_QUANTITY}`,
      );
    }
    this._quantity += quantity;
  }

  private decrease(quantity: number): void {
    if (quantity > this.available) {
      throw new InsufficientStockError(
        this._productId,
        this.available,
        quantity,
      );
    }
    this._quantity -= quantity;
  }

  private adjust(quantity: number): void {
    if (quantity < this._reserved) {
      throw new StockBelowReservedError(
        this._productId,
        this._reserved,
        quantity,
      );
    }
    this._quantity = quantity;
  }
}
