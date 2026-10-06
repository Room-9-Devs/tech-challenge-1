import { randomUUID } from 'crypto';

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

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  public hasBalance(): boolean {
    return this._quantity > 0 || this._reserved > 0;
  }
}
