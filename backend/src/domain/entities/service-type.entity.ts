import { randomUUID } from 'crypto';
import { InvalidServiceTypeError } from '../errors/invalid-service-type.error';

export interface ServiceTypeProps {
  id?: string;
  description: string;
  unitValue: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ServiceType {
  private readonly _id: string;
  private _description: string;
  private _unitValue: number;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: ServiceTypeProps) {
    this._id = props.id ?? randomUUID();
    this._description = props.description;
    this._unitValue = props.unitValue;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  public static create(props: ServiceTypeProps): ServiceType {
    ServiceType.validateDescription(props.description);
    ServiceType.validateUnitValue(props.unitValue);

    return new ServiceType(props);
  }

  public static reconstitute(props: ServiceTypeProps): ServiceType {
    return new ServiceType(props);
  }

  get id(): string {
    return this._id;
  }

  get description(): string {
    return this._description;
  }

  get unitValue(): number {
    return this._unitValue;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  public changeDescription(description: string): void {
    ServiceType.validateDescription(description);
    this._description = description;
    this._updatedAt = new Date();
  }

  public changeUnitValue(unitValue: number): void {
    ServiceType.validateUnitValue(unitValue);
    this._unitValue = unitValue;
    this._updatedAt = new Date();
  }

  private static validateDescription(description: string): void {
    if (!description || description.trim().length === 0) {
      throw new InvalidServiceTypeError('A descrição é obrigatória');
    }
    if (description.trim().length < 2) {
      throw new InvalidServiceTypeError(
        'A descrição deve ter pelo menos 2 caracteres',
      );
    }
    if (description.trim().length > 255) {
      throw new InvalidServiceTypeError(
        'A descrição deve ter no máximo 255 caracteres',
      );
    }
  }

  private static validateUnitValue(unitValue: number): void {
    if (unitValue === undefined || unitValue === null) {
      throw new InvalidServiceTypeError('O valor unitário é obrigatório');
    }
    if (typeof unitValue !== 'number' || Number.isNaN(unitValue)) {
      throw new InvalidServiceTypeError('O valor unitário deve ser um número');
    }
    if (unitValue < 0) {
      throw new InvalidServiceTypeError('O valor unitário deve ser maior ou igual a 0');
    }
  }
}
