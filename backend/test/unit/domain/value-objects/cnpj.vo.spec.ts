import { Cnpj } from '@/domain/value-objects/cnpj.vo';
import { InvalidUserError } from '@/domain/errors/invalid-user.error';

describe('Cnpj Value Object', () => {
  it('normalizes and validates a valid numeric CNPJ', () => {
    const cnpj = new Cnpj('11.222.333/0001-81');
    expect(cnpj.value).toBe('11222333000181');
    expect(cnpj.format()).toBe('11.222.333/0001-81');
    expect(cnpj.toString()).toBe('11222333000181');
  });

  it('validates an unformatted numeric CNPJ', () => {
    const cnpj = Cnpj.create('11222333000181');
    expect(cnpj.value).toBe('11222333000181');
    expect(cnpj.format()).toBe('11.222.333/0001-81');
  });

  it.each([
    ['12.ABC.345/01DE-35', '12ABC34501DE35', '12.ABC.345/01DE-35'],
    ['12.abc.345/01de-35', '12ABC34501DE35', '12.ABC.345/01DE-35'],
    ['00.000.000/E08G-12', '00000000E08G12', '00.000.000/E08G-12'],
  ])(
    'validates official alphanumeric CNPJ: %s',
    (input, expectedValue, expectedFormatted) => {
      const cnpj = new Cnpj(input);
      expect(cnpj.value).toBe(expectedValue);
      expect(cnpj.format()).toBe(expectedFormatted);
    },
  );

  it('formats unmasked string using static format', () => {
    expect(Cnpj.format('11222333000181')).toBe('11.222.333/0001-81');
    expect(Cnpj.format('12ABC34501DE35')).toBe('12.ABC.345/01DE-35');
    expect(Cnpj.format('')).toBe('');
  });

  it('compares two Cnpj instances for equality', () => {
    const cnpj1 = new Cnpj('11.222.333/0001-81');
    const cnpj2 = new Cnpj('11222333000181');
    const cnpj3 = new Cnpj('12.ABC.345/01DE-35');

    expect(cnpj1.equals(cnpj2)).toBe(true);
    expect(cnpj1.equals(cnpj3)).toBe(false);
  });

  it.each([
    '11.222.333/0001-82',
    '52998224725',
    '00000000000000',
    '12ABC34501DE36',
    '12ABC34501DE3A',
    '12ABC34501DÉ35',
    '123',
    '',
    '12ABC34501DE350',
  ])('rejects invalid CNPJ: %s', (value) => {
    expect(() => new Cnpj(value)).toThrow(InvalidUserError);
  });

  it('rejects non-string values', () => {
    expect(() => new Cnpj(null as unknown as string)).toThrow(InvalidUserError);
    expect(() => new Cnpj(undefined as unknown as string)).toThrow(
      InvalidUserError,
    );
  });
});
