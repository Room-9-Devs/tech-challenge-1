import { InvalidUserError } from '../errors/invalid-user.error';

export type BrazilianDocumentType = 'CPF' | 'CNPJ';

function checkDigit(digits: string, weights: number[]): number {
  // Receita Federal: ASCII value minus 48 works for both digits and A-Z.
  const sum = weights.reduce(
    (total, weight, index) => total + (digits.charCodeAt(index) - 48) * weight,
    0,
  );
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}

export function normalizeAndValidateDocument(
  type: BrazilianDocumentType,
  value: string,
): string {
  if (typeof value !== 'string' || !/^[A-Z0-9.\-/\s]+$/i.test(value)) {
    throw new InvalidUserError('Invalid CPF/CNPJ');
  }
  const digits = value.replace(/[.\-/\s]/g, '').toUpperCase();
  if (/^(\d)\1+$/.test(digits)) throw new InvalidUserError('Invalid CPF/CNPJ');

  if (type === 'CPF' && /^\d{11}$/.test(digits)) {
    const first = checkDigit(digits, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
    const second = checkDigit(digits, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
    if (first === Number(digits[9]) && second === Number(digits[10]))
      return digits;
  }
  if (type === 'CNPJ' && /^[A-Z0-9]{12}\d{2}$/.test(digits)) {
    const first = checkDigit(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    const second = checkDigit(digits, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    if (first === Number(digits[12]) && second === Number(digits[13]))
      return digits;
  }
  throw new InvalidUserError('Invalid CPF/CNPJ');
}
