import { UserEntityType } from '@/domain/entities/user.entity';
import { DocumentType } from '@/domain/types';

export interface CreateUserInputDto {
  username: string;
  email: string;
  password: string;
  entityType: UserEntityType;
  name: string;
  documentType: DocumentType;
  document: string;
  phone: string;
  jobTitle?: string;
}