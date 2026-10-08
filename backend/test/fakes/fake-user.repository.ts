import { ProfileRepository } from '@/application/ports/profile.repository';
import { User } from '@/domain/entities/user.entity';
import { UserRepository } from '@/domain/repositories/user.repository';
import { PaginatedOutput, PaginationQuery } from '@/shared/pagination/pagination.types';
import { compareValues } from '../helpers/compare-values';

export class FakeUserRepository implements UserRepository {
  private users: User[] = [];

  constructor(private readonly profiles?: Pick<ProfileRepository, 'findById'>) { }

  private async resolveProfileNames(): Promise<Map<string, string>> {
    const names = new Map<string, string>();
    await Promise.all(
      this.users.map(async (user) => {
        const profile = await this.profiles?.findById(user.entityType, user.entityId);
        names.set(user.id, profile?.name ?? '');
      }),
    );
    return names;
  }

  private readField(user: User, field: string, names: Map<string, string>): unknown {
    if (field === 'profile.name') return names.get(user.id) ?? '';
    return (user as unknown as Record<string, unknown>)[field];
  }

  async save(user: User): Promise<User> {
    const index = this.users.findIndex((item) => item.id === user.id);
    if (index >= 0) this.users[index] = user;
    else this.users.push(user);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id) || null;
  }

  async findAll(
    query?: PaginationQuery & { filters?: Record<string, string | number> },
  ): Promise<PaginatedOutput<User>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;
    const search = query?.search?.trim().toLowerCase();
    const filters = query?.filters ?? {};

    const allowedFilters = ['username', 'email', 'entityType', 'profile.name'];

    const usesProfileName =
      !!search ||
      Object.keys(filters).some((key) => key === 'profile.name') ||
      (query?.sort ?? []).some(({ field }) => field === 'profile.name');
    const names = usesProfileName
      ? await this.resolveProfileNames()
      : new Map<string, string>();

    let data = this.users;

    for (const [key, value] of Object.entries(filters)) {
      if (!allowedFilters.includes(key)) continue;

      data = data.filter((user) => this.readField(user, key, names) === value);
    }

    if (search) {
      const terms = search.split(/\s+/);
      data = data.filter((user) =>
        terms.some((term: string) =>
          [user.username, user.email, this.readField(user, 'profile.name', names)].some((value) =>
            String(value).toLowerCase().includes(term),
          ),
        ),
      );
    }

    const allowedSortColumns = ['profile.name', 'username', 'email', 'entityType', 'createdAt', 'updatedAt'];

    if (query?.sort && query.sort.length > 0) {
      data.sort((a, b) => {
        for (const { field, order } of query.sort!) {
          if (!allowedSortColumns.includes(field)) continue;

          const valueA = this.readField(a, field, names);
          const valueB = this.readField(b, field, names);

          if (valueA == null || valueB == null) continue;

          const comparison = compareValues(valueA, valueB);
          if (comparison !== 0) {
            return order === 'asc' ? comparison : -comparison;
          }
        }
        return 0;
      });
    }

    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const startIndex = (page - 1) * limit;
    data = data.slice(startIndex, startIndex + limit);

    return {
      data,
      meta: { page, limit, totalItems, totalPages },
    };
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
