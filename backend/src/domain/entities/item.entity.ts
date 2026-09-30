import { randomUUID } from 'crypto';
import { InvalidItemError } from '../errors/invalid-item.error';

export enum ItemType {
  PART = 'PART',
  CONSUMABLE = 'CONSUMABLE',
}

export enum ItemUnit {
  UNIT = 'UNIT',
  LITER = 'LITER',
  KILOGRAM = 'KILOGRAM',
  METER = 'METER',
}

export interface ItemProps {
  id?: string;
  sku: string;
  name: string;
  description?: string | null;
  itemType: ItemType;
  unit: ItemUnit;
  cost: number;
  salePrice: number;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Item {
  private readonly _id: string;
  private _sku: string;
  private _name: string;
  private _description: string | null;
  private _itemType: ItemType;
  private _unit: ItemUnit;
  private _cost: number;
  private _salePrice: number;
  private _active: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: ItemProps) {
    this._id = props.id ?? randomUUID();
    this._sku = props.sku;
    this._name = props.name;
    this._description = props.description ?? null;
    this._itemType = props.itemType;
    this._unit = props.unit;
    this._cost = props.cost;
    this._salePrice = props.salePrice;
    this._active = props.active ?? true;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  public static create(props: ItemProps): Item {
    Item.validateSku(props.sku);
    Item.validateName(props.name);
    Item.validateDescription(props.description);
    Item.validateItemType(props.itemType);
    Item.validateUnit(props.unit);
    Item.validatePrice(props.cost, 'Cost');
    Item.validatePrice(props.salePrice, 'Sale price');

    return new Item(props);
  }

  public static reconstitute(props: ItemProps): Item {
    return new Item(props);
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

  get itemType(): ItemType {
    return this._itemType;
  }

  get unit(): ItemUnit {
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
    Item.validateSku(sku);
    this._sku = sku;
    this._updatedAt = new Date();
  }

  public changeName(name: string): void {
    Item.validateName(name);
    this._name = name;
    this._updatedAt = new Date();
  }

  public changeDescription(description: string | null | undefined): void {
    Item.validateDescription(description);
    this._description = description ?? null;
    this._updatedAt = new Date();
  }

  public changeItemType(itemType: ItemType): void {
    Item.validateItemType(itemType);
    this._itemType = itemType;
    this._updatedAt = new Date();
  }

  public changeUnit(unit: ItemUnit): void {
    Item.validateUnit(unit);
    this._unit = unit;
    this._updatedAt = new Date();
  }

  public changeCost(cost: number): void {
    Item.validatePrice(cost, 'Cost');
    this._cost = cost;
    this._updatedAt = new Date();
  }

  public changeSalePrice(salePrice: number): void {
    Item.validatePrice(salePrice, 'Sale price');
    this._salePrice = salePrice;
    this._updatedAt = new Date();
  }

  public deactivate(): void {
    this._active = false;
    this._updatedAt = new Date();
  }

  private static validateSku(sku: string): void {
    if (!sku || sku.trim().length === 0) {
      throw new InvalidItemError('SKU is required');
    }
    if (sku.trim().length > 100) {
      throw new InvalidItemError('SKU must be at most 100 characters long');
    }
  }

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new InvalidItemError('Name is required');
    }
    if (name.trim().length < 2) {
      throw new InvalidItemError('Name must be at least 2 characters long');
    }
    if (name.trim().length > 255) {
      throw new InvalidItemError('Name must be at most 255 characters long');
    }
  }

  private static validateDescription(
    description: string | null | undefined,
  ): void {
    if (description && description.trim().length > 255) {
      throw new InvalidItemError(
        'Description must be at most 255 characters long',
      );
    }
  }

  private static validateItemType(itemType: ItemType): void {
    if (!Object.values(ItemType).includes(itemType)) {
      throw new InvalidItemError(
        `Item type must be one of: ${Object.values(ItemType).join(', ')}`,
      );
    }
  }

  private static validateUnit(unit: ItemUnit): void {
    if (!Object.values(ItemUnit).includes(unit)) {
      throw new InvalidItemError(
        `Unit must be one of: ${Object.values(ItemUnit).join(', ')}`,
      );
    }
  }

  private static validatePrice(value: number, field: string): void {
    if (value === undefined || value === null) {
      throw new InvalidItemError(`${field} is required`);
    }
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new InvalidItemError(`${field} must be a number`);
    }
    if (value < 0) {
      throw new InvalidItemError(`${field} must be greater than or equal to 0`);
    }
  }
}
