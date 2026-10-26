import { InvalidUserError } from '../errors/invalid-user.error';

export class Phone {
  private readonly _value: string;

  constructor(value: string) {
    if (typeof value !== 'string') {
      throw new InvalidUserError('Número de telefone inválido');
    }

    const trimmed = value.trim();
    if (!trimmed) {
      throw new InvalidUserError('Número de telefone inválido');
    }

    if (!/^[\d()\-\s]+$/.test(trimmed)) {
      throw new InvalidUserError('Número de telefone inválido');
    }

    const digits = trimmed.replace(/\D/g, '');

    if (digits.length !== 10 && digits.length !== 11) {
      throw new InvalidUserError('Número de telefone inválido');
    }

    const ddd = digits.slice(0, 2);
    if (!/^[1-9]\d$/.test(ddd)) {
      throw new InvalidUserError('Número de telefone inválido');
    }
    if (/^(\d)\1+$/.test(digits)) {
      throw new InvalidUserError('Número de telefone inválido');
    }

    if (/[\s()\-]/.test(trimmed)) {
      const formattedPattern =
        /^(?:\(([1-9]\d)\)\s?|([1-9]\d)\s?)(\d{4,5})-(\d{4})$/;
      if (!formattedPattern.test(trimmed)) {
        throw new InvalidUserError('Número de telefone inválido');
      }
    }

    this._value = digits;
  }

  public static create(value: string): Phone {
    return new Phone(value);
  }

  get value(): string {
    return this._value;
  }

  public format(): string {
    return Phone.format(this._value);
  }

  public static format(value: string): string {
    if (!value) return '';
    const digits = value.replace(/\D/g, '');
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
    }
    return value;
  }

  public equals(other: Phone): boolean {
    if (!other || !(other instanceof Phone)) return false;
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}
