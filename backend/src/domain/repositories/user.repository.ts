import { User } from '../entities/user.entity';

export interface UserFilter {
  entityType?: 'client' | 'employee';
  roleSlug?: string;
}

export interface UserRepository {
  save(user: User): Promise<User>;
  findById(id: string): Promise<User | null>;
  findAll(filter?: UserFilter): Promise<User[]>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
}
