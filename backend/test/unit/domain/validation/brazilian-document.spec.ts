import { normalizeAndValidateDocument } from '@/domain/validation/brazilian-document';
import { InvalidUserError } from '@/domain/errors/invalid-user.error';

describe('Brazilian document validation', () => {
  it('normalizes valid CPF and CNPJ', () => {
    expect(normalizeAndValidateDocument('CPF', '529.982.247-25')).toBe(
      '52998224725',
    );
    expect(normalizeAndValidateDocument('CNPJ', '11.222.333/0001-81')).toBe(
      '11222333000181',
    );
  });

  it.each([
    ['12.ABC.345/01DE-35', '12ABC34501DE35'],
    ['12.abc.345/01de-35', '12ABC34501DE35'],
    ['00.000.000/E08G-12', '00000000E08G12'],
  ])('validates official alphanumeric CNPJ examples: %s', (input, expected) => {
    expect(normalizeAndValidateDocument('CNPJ', input)).toBe(expected);
  });

  it.each([
    ['CPF', '111.111.111-11'],
    ['CPF', '529.982.247-26'],
    ['CPF', '11222333000181'],
    ['CNPJ', '11.222.333/0001-82'],
    ['CNPJ', '52998224725'],
    ['CPF', '529abc98224725'],
    ['CNPJ', '12ABC34501DE36'],
    ['CNPJ', '12ABC34501DE3A'],
    ['CNPJ', '12ABC34501DÉ35'],
    ['CNPJ', '00000000000000'],
  ] as const)('rejects invalid %s %s', (type, value) => {
    expect(() => normalizeAndValidateDocument(type, value)).toThrow(
      InvalidUserError,
    );
  });
});
