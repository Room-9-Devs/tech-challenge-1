import { Cpf, Cnpj, Phone } from '@/domain/value-objects';
import { ProfileRecord } from '@/application/ports/profile.repository';

export function maskProfile(
  profile: ProfileRecord | null,
): ProfileRecord | Record<string, never> {
  if (!profile || typeof profile !== 'object') {
    return {};
  }

  let maskedDocument = profile.document;
  if (profile.document) {
    if (profile.documentType === 'CPF') {
      maskedDocument = Cpf.format(profile.document);
    } else if (profile.documentType === 'CNPJ') {
      maskedDocument = Cnpj.format(profile.document);
    } else {
      const clean = profile.document.replace(/[.\-/\s]/g, '');
      maskedDocument =
        clean.length === 11 ? Cpf.format(clean) : Cnpj.format(clean);
    }
  }

  let maskedPhone = profile.phone;
  if (profile.phone) {
    maskedPhone = Phone.format(profile.phone);
  }

  return {
    ...profile,
    document: maskedDocument,
    phone: maskedPhone,
  };
}
