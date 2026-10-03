import { UserEntityType } from '@/domain/entities/user.entity';

export const PROFILE_REPOSITORY = Symbol('PROFILE_REPOSITORY');

export interface ClientProfileInput {
  name: string;
  documentType: 'CPF' | 'CNPJ';
  document: string;
  phone: string;
}

export interface EmployeeProfileInput {
  name: string;
  documentType: 'CPF' | 'CNPJ';
  document: string;
  jobTitle?: string;
  phone: string;
}

export interface ProfileRecord {
  id: string;
  name: string;
  type: UserEntityType;
  documentType?: 'CPF' | 'CNPJ';
  document?: string;
  phone: string;
  jobTitle?: string;
}

export interface ProfileRepository {
  createClient(input: ClientProfileInput): Promise<ProfileRecord>;
  createEmployee(input: EmployeeProfileInput): Promise<ProfileRecord>;
  findById(type: UserEntityType, id: string): Promise<ProfileRecord | null>;
}
