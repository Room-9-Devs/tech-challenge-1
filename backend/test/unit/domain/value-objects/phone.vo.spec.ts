import { Phone } from '@/domain/value-objects/phone.vo';
import { InvalidUserError } from '@/domain/errors/invalid-user.error';

describe('Phone Value Object', () => {
  it('normalizes and validates an 11-digit mobile phone formatted as (xx) xxxxx-xxxx', () => {
    const phone = new Phone('(11) 99999-9999');
    expect(phone.value).toBe('11999999999');
    expect(phone.format()).toBe('(11) 99999-9999');
    expect(phone.toString()).toBe('11999999999');
  });

  it('validates an 11-digit mobile phone without formatting', () => {
    const phone = Phone.create('11999999999');
    expect(phone.value).toBe('11999999999');
    expect(phone.format()).toBe('(11) 99999-9999');
  });

  it('normalizes and validates a 10-digit landline phone formatted as (xx) xxxx-xxxx', () => {
    const phone = new Phone('(11) 3333-4444');
    expect(phone.value).toBe('1133334444');
    expect(phone.format()).toBe('(11) 3333-4444');
  });

  it('validates a 10-digit landline phone without formatting', () => {
    const phone = Phone.create('1133334444');
    expect(phone.value).toBe('1133334444');
    expect(phone.format()).toBe('(11) 3333-4444');
  });

  it('formats unmasked string using static format', () => {
    expect(Phone.format('11999999999')).toBe('(11) 99999-9999');
    expect(Phone.format('1133334444')).toBe('(11) 3333-4444');
    expect(Phone.format('')).toBe('');
  });

  it('compares two Phone instances for equality', () => {
    const phone1 = new Phone('(11) 99999-9999');
    const phone2 = new Phone('11999999999');
    const phone3 = new Phone('(11) 3333-4444');

    expect(phone1.equals(phone2)).toBe(true);
    expect(phone1.equals(phone3)).toBe(false);
  });

  it.each([
    '(11) 999-99999',
    '(11) 999999999',
    '11-99999-9999',
    '123',
    '119999999999', // 12 digits
    '119999999', // 9 digits
    '(00) 99999-9999', // invalid DDD
    '(01) 99999-9999', // invalid DDD
    '11111111111', // repeated digits
    '(11) 11111-1111', // repeated digits
    '00000000000',
    '1199999aaaa', // non-numeric
    'phone-number',
    '',
  ])('rejects invalid phone: %s', (value) => {
    expect(() => new Phone(value)).toThrow(InvalidUserError);
  });

  it('rejects non-string values', () => {
    expect(() => new Phone(null as unknown as string)).toThrow(
      InvalidUserError,
    );
    expect(() => new Phone(undefined as unknown as string)).toThrow(
      InvalidUserError,
    );
  });
});
