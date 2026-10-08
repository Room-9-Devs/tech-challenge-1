import { PaginatedOutput } from '@/shared/pagination/pagination.types';

export interface ListUsersItemOutputDto {
  id: string;
  username: string;
  email: string;
  entityType: 'client' | 'employee';
  entityId: string;
  role: string;
  profile: object;
  createdAt: Date;
  updatedAt: Date;
}

export type ListUsersOutputDto = PaginatedOutput<ListUsersItemOutputDto>;