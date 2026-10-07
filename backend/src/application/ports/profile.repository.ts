import { UserEntityType } from '@/domain/entities/user.entity';
import { DocumentType } from '@/domain/types';

export const PROFILE_REPOSITORY = Symbol('PROFILE_REPOSITORY');

export interface ClientProfileInput {
  id?: string;
  name: string;
  documentType: DocumentType;
  document: string;
  phone: string;
}

export interface EmployeeProfileInput {
  id?: string;
  name: string;
  documentType: DocumentType;
  document: string;
  jobTitle?: string;
  phone: string;
}

export interface ProfileRecord {
  id: string;
  name: string;
  type: UserEntityType;
  documentType?: DocumentType;
  document?: string;
  phone: string;
  jobTitle?: string;
}

export interface ProfileRepository {
  createClient(input: ClientProfileInput): Promise<ProfileRecord>;
  createEmployee(input: EmployeeProfileInput): Promise<ProfileRecord>;
  findById(type: UserEntityType, id: string): Promise<ProfileRecord | null>;
}
