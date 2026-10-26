import { randomUUID } from 'crypto';
import { InvalidProductError } from '../errors/invalid-product.error';

export enum ProductType {
  PART = 'PART',
  CONSUMABLE = 'CONSUMABLE',
}

export enum ProductUnit {
  UNIT = 'UNIT',
  LITER = 'LITER',
  KILOGRAM = 'KILOGRAM',
  METER = 'METER',
}

export interface ProductProps {
  id?: string;
  sku: string;
  name: string;
  description?: string | null;
  productType: ProductType;
  unit: ProductUnit;
  cost: number;
  salePrice: number;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Product {
  private readonly _id: string;
  private _sku: string;
  private _name: string;
  private _description: string | null;
  private _productType: ProductType;
  private _unit: ProductUnit;
  private _cost: number;
  private _salePrice: number;
  private _active: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: ProductProps) {
    this._id = props.id ?? randomUUID();
    this._sku = props.sku;
    this._name = props.name;
    this._description = props.description ?? null;
    this._productType = props.productType;
    this._unit = props.unit;
    this._cost = props.cost;
    this._salePrice = props.salePrice;
    this._active = props.active ?? true;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  public static create(props: ProductProps): Product {
    Product.validateSku(props.sku);
    Product.validateName(props.name);
    Product.validateDescription(props.description);
    Product.validateProductType(props.productType);
    Product.validateUnit(props.unit);
    Product.validatePrice(props.cost, 'O custo');
    Product.validatePrice(props.salePrice, 'O preço de venda');

    return new Product(props);
  }

  public static reconstitute(props: ProductProps): Product {
    return new Product(props);
  }

  get id(): string {
    return this._id;
  }

  get sku(): string {
    return this._sku;
  }

  get name(): string {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get productType(): ProductType {
    return this._productType;
  }

  get unit(): ProductUnit {
    return this._unit;
  }

  get cost(): number {
    return this._cost;
  }

  get salePrice(): number {
    return this._salePrice;
  }

  get active(): boolean {
    return this._active;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  public changeSku(sku: string): void {
    Product.validateSku(sku);
    this._sku = sku;
    this._updatedAt = new Date();
  }

  public changeName(name: string): void {
    Product.validateName(name);
    this._name = name;
    this._updatedAt = new Date();
  }

  public changeDescription(description: string | null | undefined): void {
    Product.validateDescription(description);
    this._description = description ?? null;
    this._updatedAt = new Date();
  }

  public changeProductType(productType: ProductType): void {
    Product.validateProductType(productType);
    this._productType = productType;
    this._updatedAt = new Date();
  }

  public changeUnit(unit: ProductUnit): void {
    Product.validateUnit(unit);
    this._unit = unit;
    this._updatedAt = new Date();
  }

  public changeCost(cost: number): void {
    Product.validatePrice(cost, 'O custo');
    this._cost = cost;
    this._updatedAt = new Date();
  }

  public changeSalePrice(salePrice: number): void {
    Product.validatePrice(salePrice, 'O preço de venda');
    this._salePrice = salePrice;
    this._updatedAt = new Date();
  }

  public deactivate(): void {
    this._active = false;
    this._updatedAt = new Date();
  }

  public activate(): void {
    this._active = true;
    this._updatedAt = new Date();
  }

  private static validateSku(sku: string): void {
    if (!sku || sku.trim().length === 0) {
      throw new InvalidProductError('O SKU é obrigatório');
    }
    if (sku.trim().length > 100) {
      throw new InvalidProductError('O SKU deve ter no máximo 100 caracteres');
    }
  }

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new InvalidProductError('O nome é obrigatório');
    }
    if (name.trim().length < 2) {
      throw new InvalidProductError('O nome deve ter pelo menos 2 caracteres');
    }
    if (name.trim().length > 255) {
      throw new InvalidProductError('O nome deve ter no máximo 255 caracteres');
    }
  }

  private static validateDescription(
    description: string | null | undefined,
  ): void {
    if (description && description.trim().length > 255) {
      throw new InvalidProductError(
        'A descrição deve ter no máximo 255 caracteres',
      );
    }
  }

  private static validateProductType(productType: ProductType): void {
    if (!Object.values(ProductType).includes(productType)) {
      throw new InvalidProductError(
        `O tipo do produto deve ser um dos valores: ${Object.values(ProductType).join(', ')}`,
      );
    }
  }

  private static validateUnit(unit: ProductUnit): void {
    if (!Object.values(ProductUnit).includes(unit)) {
      throw new InvalidProductError(
        `A unidade deve ser um dos valores: ${Object.values(ProductUnit).join(', ')}`,
      );
    }
  }

  private static validatePrice(value: number, field: string): void {
    if (value === undefined || value === null) {
      throw new InvalidProductError(`${field} é obrigatório`);
    }
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new InvalidProductError(`${field} deve ser um número`);
    }
    if (value < 0) {
      throw new InvalidProductError(`${field} deve ser maior ou igual a 0`);
    }
  }
}
