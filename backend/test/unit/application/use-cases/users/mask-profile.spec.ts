import { maskProfile } from '@/application/use-cases/users/mask-profile';
import { ProfileRecord } from '@/application/ports/profile.repository';

describe('maskProfile', () => {
  it('returns empty object when profile is null or invalid', () => {
    expect(maskProfile(null)).toEqual({});
    expect(maskProfile(undefined as unknown as null)).toEqual({});
    expect(maskProfile('invalid' as unknown as null)).toEqual({});
  });

  it('masks CPF document and 11-digit mobile phone', () => {
    const profile: ProfileRecord = {
      id: 'profile-1',
      name: 'João Silva',
      type: 'client',
      documentType: 'CPF',
      document: '52998224725',
      phone: '11999999999',
    };

    const result = maskProfile(profile);

    expect(result).toEqual({
      id: 'profile-1',
      name: 'João Silva',
      type: 'client',
      documentType: 'CPF',
      document: '529.982.247-25',
      phone: '(11) 99999-9999',
    });
  });

  it('masks standard CNPJ and 10-digit landline phone', () => {
    const profile: ProfileRecord = {
      id: 'profile-2',
      name: 'Empresa XPTO',
      type: 'client',
      documentType: 'CNPJ',
      document: '11222333000181',
      phone: '1133334444',
    };

    const result = maskProfile(profile);

    expect(result).toEqual({
      id: 'profile-2',
      name: 'Empresa XPTO',
      type: 'client',
      documentType: 'CNPJ',
      document: '11.222.333/0001-81',
      phone: '(11) 3333-4444',
    });
  });

  it('masks alphanumeric CNPJ correctly', () => {
    const profile: ProfileRecord = {
      id: 'profile-3',
      name: 'Empresa Tech',
      type: 'client',
      documentType: 'CNPJ',
      document: '12ABC34501DE35',
      phone: '11999999991',
    };

    const result = maskProfile(profile);

    expect(result).toEqual({
      id: 'profile-3',
      name: 'Empresa Tech',
      type: 'client',
      documentType: 'CNPJ',
      document: '12.ABC.345/01DE-35',
      phone: '(11) 99999-9991',
    });
  });

  it('infers document type by length when documentType is omitted', () => {
    const cpfProfile: ProfileRecord = {
      id: 'profile-4',
      name: 'Carlos',
      type: 'employee',
      document: '52998224725',
      phone: '11988887777',
    };
    expect(maskProfile(cpfProfile).document).toBe('529.982.247-25');

    const cnpjProfile: ProfileRecord = {
      id: 'profile-5',
      name: 'Alpha SA',
      type: 'client',
      document: '12ABC34501DE35',
      phone: '1133332222',
    };
    expect(maskProfile(cnpjProfile).document).toBe('12.ABC.345/01DE-35');
  });

  it('preserves undefined document or phone', () => {
    const profile: ProfileRecord = {
      id: 'profile-6',
      name: 'Sem Documento',
      type: 'client',
      phone: '',
    };

    const result = maskProfile(profile);
    expect(result.document).toBeUndefined();
    expect(result.phone).toBe('');
  });
});
