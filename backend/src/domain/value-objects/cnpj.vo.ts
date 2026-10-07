import { InvalidUserError } from '../errors/invalid-user.error';

export class Cnpj {
  private readonly _value: string;

  constructor(value: string) {
    if (typeof value !== 'string') {
      throw new InvalidUserError('CNPJ inválido');
    }

    if (!/^[A-Za-z0-9.\-/\s]+$/.test(value)) {
      throw new InvalidUserError('CNPJ inválido');
    }

    const clean = value.replace(/[.\-/\s]/g, '').toUpperCase();

    if (!/^[A-Z0-9]{12}\d{2}$/.test(clean)) {
      throw new InvalidUserError('CNPJ inválido');
    }
    if (/^(\d)\1+$/.test(clean)) {
      throw new InvalidUserError('CNPJ inválido');
    }
    const firstCheck = this.calculateCheckDigit(
      clean,
      [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    );
    if (firstCheck !== Number(clean[12])) {
      throw new InvalidUserError('CNPJ inválido');
    }

    const secondCheck = this.calculateCheckDigit(
      clean,
      [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    );
    if (secondCheck !== Number(clean[13])) {
      throw new InvalidUserError('CNPJ inválido');
    }

    this._value = clean;
  }

  public static create(value: string): Cnpj {
    return new Cnpj(value);
  }

  get value(): string {
    return this._value;
  }

  public format(): string {
    return Cnpj.format(this._value);
  }

  public static format(value: string): string {
    if (!value) return '';
    const clean = value.replace(/[.\-/\s]/g, '').toUpperCase();
    if (clean.length === 14) {
      return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12, 14)}`;
    }
    return value;
  }

  public equals(other: Cnpj): boolean {
    if (!other || !(other instanceof Cnpj)) return false;
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }

  private calculateCheckDigit(characters: string, weights: number[]): number {
    const sum = weights.reduce(
      (total, weight, index) =>
        total + (characters.charCodeAt(index) - 48) * weight,
      0,
    );
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  }
}
