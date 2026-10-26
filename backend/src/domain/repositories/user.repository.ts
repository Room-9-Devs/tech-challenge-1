import { PaginatedOutput, PaginationQuery } from '@/shared/pagination/pagination.types';
import { User } from '../entities/user.entity';

export interface UserRepository {
  save(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findAll(query?: PaginationQuery & { filters?: Record<string, string | object | number> }): Promise<PaginatedOutput<User>>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
}
