import { UserEntityType } from '@/domain/entities/user.entity';
import { DocumentType } from '@/domain/types';

export interface CreateUserOutputDto {
  id: string;
  username: string;
  email: string;
  entityType: UserEntityType;
  entityId: string;
  role: string;
  profile: {
    id: string;
    name: string;
    phone: string;
    documentType?: DocumentType;
    document?: string;
    jobTitle?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}