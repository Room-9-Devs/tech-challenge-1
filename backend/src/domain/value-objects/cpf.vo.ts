import { InvalidUserError } from '../errors/invalid-user.error';

export class Cpf {
  private readonly _value: string;

  constructor(value: string) {
    if (typeof value !== 'string') {
      throw new InvalidUserError('CPF inválido');
    }

    if (!/^[\d.\-\s]+$/.test(value)) {
      throw new InvalidUserError('CPF inválido');
    }

    const digits = value.replace(/\D/g, '');

    if (digits.length !== 11) {
      throw new InvalidUserError('CPF inválido');
    }

    if (/^(\d)\1+$/.test(digits)) {
      throw new InvalidUserError('CPF inválido');
    }

    const firstCheck = this.calculateCheckDigit(
      digits,
      [10, 9, 8, 7, 6, 5, 4, 3, 2],
    );
    if (firstCheck !== Number(digits[9])) {
      throw new InvalidUserError('CPF inválido');
    }

    const secondCheck = this.calculateCheckDigit(
      digits,
      [11, 10, 9, 8, 7, 6, 5, 4, 3, 2],
    );
    if (secondCheck !== Number(digits[10])) {
      throw new InvalidUserError('CPF inválido');
    }

    this._value = digits;
  }

  public static create(value: string): Cpf {
    return new Cpf(value);
  }

  get value(): string {
    return this._value;
  }

  public format(): string {
    return Cpf.format(this._value);
  }

  public static format(value: string): string {
    if (!value) return '';
    const digits = value.replace(/\D/g, '');
    if (digits.length === 11) {
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
    }
    return value;
  }

  public equals(other: Cpf): boolean {
    if (!other || !(other instanceof Cpf)) return false;
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }

  private calculateCheckDigit(digits: string, weights: number[]): number {
    const sum = weights.reduce(
      (total, weight, index) => total + Number(digits[index]) * weight,
      0,
    );
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  }
}
