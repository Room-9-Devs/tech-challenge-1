import { randomUUID } from 'crypto';
import { InvalidStockMovementError } from '../errors/invalid-stock-movement.error';

export const MAX_STOCK_QUANTITY = 2147483647;

export enum StockMovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT = 'ADJUSTMENT',
}

export interface StockMovementProps {
  id?: string;
  productId: string;
  quantity: number;
  previousQuantity: number | null;
  movementType: StockMovementType;
  description?: string | null;
  referenceType?: string | null;
  referenceId?: string | null;
  createdBy: string;
  createdAt?: Date;
}

export class StockMovement {
  private readonly _id: string;
  private readonly _productId: string;
  private readonly _quantity: number;
  private readonly _previousQuantity: number | null;
  private readonly _movementType: StockMovementType;
  private readonly _description: string | null;
  private readonly _referenceType: string | null;
  private readonly _referenceId: string | null;
  private readonly _createdBy: string;
  private readonly _createdAt: Date;

  private constructor(props: StockMovementProps) {
    this._id = props.id ?? randomUUID();
    this._productId = props.productId;
    this._quantity = props.quantity;
    this._previousQuantity = props.previousQuantity ?? null;
    this._movementType = props.movementType;
    this._description = props.description ?? null;
    this._referenceType = props.referenceType ?? null;
    this._referenceId = props.referenceId ?? null;
    this._createdBy = props.createdBy;
    this._createdAt = props.createdAt ?? new Date();
  }

  public static create(props: StockMovementProps): StockMovement {
    StockMovement.validateProductId(props.productId);
    StockMovement.validateMovementType(props.movementType);
    StockMovement.validateQuantity(props.quantity, props.movementType);
    StockMovement.validatePreviousQuantity(props.previousQuantity);
    StockMovement.validateReferenceType(props.referenceType);
    StockMovement.validateCreatedBy(props.createdBy);

    return new StockMovement(props);
  }

  public static reconstitute(props: StockMovementProps): StockMovement {
    return new StockMovement(props);
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

  get previousQuantity(): number | null {
    return this._previousQuantity;
  }

  get movementType(): StockMovementType {
    return this._movementType;
  }

  get description(): string | null {
    return this._description;
  }

  get referenceType(): string | null {
    return this._referenceType;
  }

  get referenceId(): string | null {
    return this._referenceId;
  }

  get createdBy(): string {
    return this._createdBy;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  private static validateProductId(productId: string): void {
    if (!productId || productId.trim().length === 0) {
      throw new InvalidStockMovementError('O produto é obrigatório');
    }
  }

  private static validateMovementType(movementType: StockMovementType): void {
    if (!Object.values(StockMovementType).includes(movementType)) {
      throw new InvalidStockMovementError(
        `O tipo da movimentação deve ser um dos valores: ${Object.values(StockMovementType).join(', ')}`,
      );
    }
  }

  private static validateQuantity(
    quantity: number,
    movementType: StockMovementType,
  ): void {
    if (quantity === undefined || quantity === null) {
      throw new InvalidStockMovementError('A quantidade é obrigatória');
    }
    if (typeof quantity !== 'number' || !Number.isInteger(quantity)) {
      throw new InvalidStockMovementError(
        'A quantidade deve ser um número inteiro',
      );
    }
    if (quantity > MAX_STOCK_QUANTITY) {
      throw new InvalidStockMovementError(
        `A quantidade deve ser menor ou igual a ${MAX_STOCK_QUANTITY}`,
      );
    }
    if (movementType === StockMovementType.ADJUSTMENT) {
      if (quantity < 0) {
        throw new InvalidStockMovementError(
          'A quantidade do ajuste deve ser maior ou igual a 0',
        );
      }
      return;
    }
    if (quantity <= 0) {
      throw new InvalidStockMovementError(
        'A quantidade deve ser maior que 0',
      );
    }
  }

  private static validatePreviousQuantity(
    previousQuantity: number | null,
  ): void {
    if (
      typeof previousQuantity !== 'number' ||
      !Number.isInteger(previousQuantity) ||
      previousQuantity < 0
    ) {
      throw new InvalidStockMovementError(
        'A quantidade anterior do estoque deve ser um número inteiro maior ou igual a 0',
      );
    }
  }

  private static validateReferenceType(
    referenceType: string | null | undefined,
  ): void {
    if (referenceType && referenceType.trim().length > 50) {
      throw new InvalidStockMovementError(
        'O tipo de referência deve ter no máximo 50 caracteres',
      );
    }
  }

  private static validateCreatedBy(createdBy: string): void {
    if (!createdBy || createdBy.trim().length === 0) {
      throw new InvalidStockMovementError(
        'O usuário responsável pela movimentação é obrigatório',
      );
    }
  }
}
