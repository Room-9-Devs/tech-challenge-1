import { randomUUID } from 'crypto';
import { InvalidRepairError } from '../errors/invalid-repair.error';

export interface RepairProps {
  id?: string;
  description: string;
  unitValue: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Repair {
  private readonly _id: string;
  private _description: string;
  private _unitValue: number;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: RepairProps) {
    this._id = props.id ?? randomUUID();
    this._description = props.description;
    this._unitValue = props.unitValue;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  public static create(props: RepairProps): Repair {
    Repair.validateDescription(props.description);
    Repair.validateUnitValue(props.unitValue);

    return new Repair(props);
  }

  public static reconstitute(props: RepairProps): Repair {
    return new Repair(props);
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
    Repair.validateDescription(description);
    this._description = description;
    this._updatedAt = new Date();
  }

  public changeUnitValue(unitValue: number): void {
    Repair.validateUnitValue(unitValue);
    this._unitValue = unitValue;
    this._updatedAt = new Date();
  }

  private static validateDescription(description: string): void {
    if (!description || description.trim().length === 0) {
      throw new InvalidRepairError('A descrição é obrigatória');
    }
    if (description.trim().length < 2) {
      throw new InvalidRepairError(
        'A descrição deve ter pelo menos 2 caracteres',
      );
    }
    if (description.trim().length > 255) {
      throw new InvalidRepairError(
        'A descrição deve ter no máximo 255 caracteres',
      );
    }
  }

  private static validateUnitValue(unitValue: number): void {
    if (unitValue === undefined || unitValue === null) {
      throw new InvalidRepairError('O valor unitário é obrigatório');
    }
    if (typeof unitValue !== 'number' || Number.isNaN(unitValue)) {
      throw new InvalidRepairError('O valor unitário deve ser um número');
    }
    if (unitValue < 0) {
      throw new InvalidRepairError('O valor unitário deve ser maior ou igual a 0');
    }
  }
}
