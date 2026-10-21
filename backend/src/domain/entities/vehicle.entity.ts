import { randomUUID } from 'crypto';
import { InvalidVehicleError } from '../errors/invalid-vehicle.error';

export interface VehicleProps {
  id?: string;
  user_id: string;
  license_plate: string;
  model: string;
  brand: string;
  year: number;
  color: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PersistedVehicleProps = Omit<VehicleProps, 'user_id'> & {
  user_id: string | null;
};

export class Vehicle {
  private readonly _id: string;
  private readonly _user_id: string | null;
  private _license_plate: string;
  private _model: string;
  private _brand: string;
  private _year: number;
  private _color: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: PersistedVehicleProps) {
    this._id = props.id ?? randomUUID();
    this._user_id = props.user_id;
    this._license_plate = Vehicle.normalizeLicensePlate(props.license_plate);
    this._model = props.model.trim();
    this._brand = props.brand.trim();
    this._year = props.year;
    this._color = props.color.trim();
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  public static create(props: VehicleProps): Vehicle {
    Vehicle.validateUserId(props.user_id);
    Vehicle.validateLicensePlate(props.license_plate);
    Vehicle.validateModel(props.model);
    Vehicle.validateBrand(props.brand);
    Vehicle.validateYear(props.year);
    Vehicle.validateColor(props.color);

    return new Vehicle(props);
  }

  public static reconstitute(props: PersistedVehicleProps): Vehicle {
    return new Vehicle(props);
  }

  get id(): string {
    return this._id;
  }

  get user_id(): string | null {
    return this._user_id;
  }

  get license_plate(): string {
    return this._license_plate;
  }

  get model(): string {
    return this._model;
  }

  get brand(): string {
    return this._brand;
  }

  get year(): number {
    return this._year;
  }

  get color(): string {
    return this._color;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  public changeLicensePlate(licensePlate: string): void {
    Vehicle.validateLicensePlate(licensePlate);
    this._license_plate = Vehicle.normalizeLicensePlate(licensePlate);
    this._updatedAt = new Date();
  }

  public changeModel(model: string): void {
    Vehicle.validateModel(model);
    this._model = model.trim();
    this._updatedAt = new Date();
  }

  public changeBrand(brand: string): void {
    Vehicle.validateBrand(brand);
    this._brand = brand.trim();
    this._updatedAt = new Date();
  }

  public changeYear(year: number): void {
    Vehicle.validateYear(year);
    this._year = year;
    this._updatedAt = new Date();
  }

  public changeColor(color: string): void {
    Vehicle.validateColor(color);
    this._color = color.trim();
    this._updatedAt = new Date();
  }

  public updateDetails(
    details: Pick<
      VehicleProps,
      'license_plate' | 'model' | 'brand' | 'year' | 'color'
    >,
  ): void {
    if (!this._user_id)
      throw new InvalidVehicleError(
        'Assign an owner before updating a legacy vehicle',
      );
    Vehicle.validateLicensePlate(details.license_plate);
    Vehicle.validateModel(details.model);
    Vehicle.validateBrand(details.brand);
    Vehicle.validateYear(details.year);
    Vehicle.validateColor(details.color);
    this._license_plate = Vehicle.normalizeLicensePlate(details.license_plate);
    this._model = details.model.trim();
    this._brand = details.brand.trim();
    this._year = details.year;
    this._color = details.color.trim();
    this._updatedAt = new Date();
  }

  private static normalizeLicensePlate(licensePlate: string): string {
    return licensePlate.trim().toUpperCase().replace('-', '');
  }

  private static validateUserId(userId: string): void {
    if (!userId || userId.trim().length === 0) {
      throw new InvalidVehicleError('O dono do veículo é obrigatório');
    }
  }

  private static validateLicensePlate(licensePlate: string): void {
    if (!licensePlate || licensePlate.trim().length === 0) {
      throw new InvalidVehicleError('A placa é obrigatória');
    }

    const licensePlateRegex = /^(?:[A-Z]{3}-?\d{4}|[A-Z]{3}\d[A-Z]\d{2})$/i;

    if (!licensePlateRegex.test(licensePlate.trim())) {
      throw new InvalidVehicleError(
        'A placa deve seguir o formato antigo ABC-1234 ou o Mercosul ABC1D23',
      );
    }
  }

  private static validateModel(model: string): void {
    Vehicle.validateText(model, 'modelo', 100);
  }

  private static validateBrand(brand: string): void {
    Vehicle.validateText(brand, 'marca', 100);
  }

  private static validateColor(color: string): void {
    Vehicle.validateText(color, 'cor', 50);
  }

  private static validateText(
    value: string,
    fieldName: string,
    maxLength: number,
  ): void {
    if (!value || value.trim().length === 0) {
      throw new InvalidVehicleError(`O campo ${fieldName} é obrigatório`);
    }
    if (value.trim().length < 2) {
      throw new InvalidVehicleError(
        `O campo ${fieldName} deve ter pelo menos 2 caracteres`,
      );
    }
    if (value.trim().length > maxLength) {
      throw new InvalidVehicleError(
        `O campo ${fieldName} deve ter no máximo ${maxLength} caracteres`,
      );
    }
  }

  private static validateYear(year: number): void {
    const maximumYear = new Date().getFullYear() + 1;

    if (!Number.isInteger(year)) {
      throw new InvalidVehicleError('O ano deve ser um número inteiro');
    }
    if (year < 1886 || year > maximumYear) {
      throw new InvalidVehicleError(
        `O ano deve estar entre 1886 e ${maximumYear}`,
      );
    }
  }
}
