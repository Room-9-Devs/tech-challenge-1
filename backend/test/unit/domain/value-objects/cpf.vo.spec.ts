import { Cpf } from '@/domain/value-objects/cpf.vo';
import { InvalidUserError } from '@/domain/errors/invalid-user.error';

describe('Cpf Value Object', () => {
  it('normalizes and validates a valid formatted CPF', () => {
    const cpf = new Cpf('529.982.247-25');
    expect(cpf.value).toBe('52998224725');
    expect(cpf.format()).toBe('529.982.247-25');
    expect(cpf.toString()).toBe('52998224725');
  });

  it('validates an unformatted valid CPF', () => {
    const cpf = Cpf.create('52998224725');
    expect(cpf.value).toBe('52998224725');
    expect(cpf.format()).toBe('529.982.247-25');
  });

  it('formats unmasked string using static format', () => {
    expect(Cpf.format('52998224725')).toBe('529.982.247-25');
    expect(Cpf.format('11144477735')).toBe('111.444.777-35');
    expect(Cpf.format('')).toBe('');
  });

  it('compares two Cpf instances for equality', () => {
    const cpf1 = new Cpf('529.982.247-25');
    const cpf2 = new Cpf('52998224725');
    const cpf3 = new Cpf('111.444.777-35');

    expect(cpf1.equals(cpf2)).toBe(true);
    expect(cpf1.equals(cpf3)).toBe(false);
  });

  it.each([
    '111.111.111-11',
    '000.000.000-00',
    '529.982.247-26',
    '11222333000181',
    '529abc98224725',
    '123',
    '',
    '123456789012',
    'abc.def.ghi-jk',
  ])('rejects invalid CPF: %s', (value) => {
    expect(() => new Cpf(value)).toThrow(InvalidUserError);
  });

  it('rejects non-string values', () => {
    expect(() => new Cpf(null as unknown as string)).toThrow(InvalidUserError);
    expect(() => new Cpf(undefined as unknown as string)).toThrow(
      InvalidUserError,
    );
  });
});
