import { UserEntityType } from '@/domain/entities/user.entity';

export interface CreateUserInputDto {
  username: string;
  email: string;
  password: string;
  entityType: UserEntityType;
  name: string;
  documentType: 'CPF' | 'CNPJ';
  document: string;
  phone: string;
  jobTitle?: string;
}
