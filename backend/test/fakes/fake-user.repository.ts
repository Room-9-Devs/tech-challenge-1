import { User } from '@/domain/entities/user.entity';
import {
  UserFilter,
  UserRepository,
} from '@/domain/repositories/user.repository';

export class FakeUserRepository implements UserRepository {
  private users: User[] = [];

  async save(user: User): Promise<User> {
    const index = this.users.findIndex((item) => item.id === user.id);
    if (index >= 0) this.users[index] = user;
    else this.users.push(user);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) || null;
  }

  async findAll(filter?: UserFilter): Promise<User[]> {
    return this.users.filter(
      (user) => !filter?.entityType || user.entityType === filter.entityType,
    );
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find((user) => user.email === email) || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.users.find((user) => user.username === username) || null;
  }

  clear(): void {
    this.users = [];
  }

  snapshot(): User[] {
    return [...this.users];
  }
  restore(users: User[]): void {
    this.users = [...users];
  }
}
