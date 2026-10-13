import { randomUUID } from 'crypto';
import { InvalidWorkOrderItemError } from '../errors/invalid-work-order-item.error';

export interface WorkOrderItemProps {
  id?: string;
  quantity: number;
  unitPrice: number;
  serviceId?: string | null;
  productId?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class WorkOrderItem {
  private readonly _id: string;
  private _quantity: number;
  private readonly _unitPrice: number;
  private readonly _serviceId: string | null;
  private readonly _productId: string | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: WorkOrderItemProps) {
    this._id = props.id ?? randomUUID();
    this._quantity = props.quantity;
    this._unitPrice = props.unitPrice;
    this._serviceId = props.serviceId ?? null;
    this._productId = props.productId ?? null;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  public static create(props: WorkOrderItemProps): WorkOrderItem {
    WorkOrderItem.validate(props);
    return new WorkOrderItem(props);
  }

  public static reconstitute(props: WorkOrderItemProps): WorkOrderItem {
    WorkOrderItem.validate(props);
    return new WorkOrderItem(props);
  }

  get id(): string {
    return this._id;
  }

  get quantity(): number {
    return this._quantity;
  }

  get unitPrice(): number {
    return this._unitPrice;
  }

  get serviceId(): string | null {
    return this._serviceId;
  }

  get productId(): string | null {
    return this._productId;
  }

  get subtotal(): number {
    return this._quantity * this._unitPrice;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  public changeQuantity(quantity: number): void {
    WorkOrderItem.validateQuantity(quantity);
    if (!Number.isFinite(quantity * this._unitPrice)) {
      throw new InvalidWorkOrderItemError(
        'O subtotal do item deve ser um número finito',
      );
    }
    this._quantity = quantity;
    this._updatedAt = new Date();
  }

  private static validate(props: WorkOrderItemProps): void {
    WorkOrderItem.validateQuantity(props.quantity);
    if (!Number.isFinite(props.unitPrice) || props.unitPrice < 0) {
      throw new InvalidWorkOrderItemError(
        'O preço unitário deve ser um número finito maior ou igual a zero',
      );
    }
    if (!Number.isFinite(props.quantity * props.unitPrice)) {
      throw new InvalidWorkOrderItemError(
        'O subtotal do item deve ser um número finito',
      );
    }

    const hasService = Boolean(props.serviceId?.trim());
    const hasProduct = Boolean(props.productId?.trim());
    if (hasService === hasProduct) {
      throw new InvalidWorkOrderItemError(
        'O item deve referenciar exatamente um serviço ou produto',
      );
    }
  }

  private static validateQuantity(quantity: number): void {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new InvalidWorkOrderItemError(
        'A quantidade deve ser um número finito maior que zero',
      );
    }
  }
}
