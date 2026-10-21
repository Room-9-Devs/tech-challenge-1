import { ProfileRepository, ProfileRecord } from '@/application/ports/profile.repository';
import { User } from '@/domain/entities/user.entity';
import { UserRepository } from '@/domain/repositories/user.repository';
import { PaginatedOutput, PaginationQuery } from '@/shared/pagination/pagination.types';
import { compareValues } from '../helpers/compare-values';

export class FakeUserRepository implements UserRepository {
  private users: User[] = [];

  constructor(private readonly profiles?: Pick<ProfileRepository, 'findById'>) { }

  private async resolveProfileRecords(): Promise<Map<string, ProfileRecord | null>> {
    const records = new Map<string, ProfileRecord | null>();
    await Promise.all(
      this.users.map(async (user) => {
        const profile = await this.profiles?.findById(user.entityType, user.entityId);
        records.set(user.id, profile ?? null);
      }),
    );
    return records;
  }

  private readField(user: User, field: string, profiles: Map<string, ProfileRecord | null>): unknown {
    const profile = profiles.get(user.id) ?? null;
    const normalizeDocument = (value: string): string =>
      value.replace(/[.\-/ \s]/g, '').toUpperCase();
    if (field === 'profile.name') return profile?.name ?? '';
    if (field === 'profile.document') return profile?.document ? normalizeDocument(profile.document) : '';
    if (field === 'cpf') {
      return profile?.documentType === 'CPF' ? normalizeDocument(profile.document) : null;
    }
    if (field === 'cnpj') {
      return profile?.documentType === 'CNPJ' ? normalizeDocument(profile.document) : null;
    }
    return (user as unknown as Record<string, unknown>)[field];
  }

  async save(user: User): Promise<User> {
    const index = this.users.findIndex((item) => item.id === user.id);
    if (index >= 0) this.users[index] = user;
    else this.users.push(user);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find((user) => user.id === id && !user.deletedAt) || null;
  }

  async findAll(
    query?: PaginationQuery & { filters?: Record<string, string | number> },
  ): Promise<PaginatedOutput<User>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;
    const search = query?.search?.trim().toLowerCase();
    const filters = query?.filters ?? {};

    const allowedFilters = ['username', 'email', 'entityType', 'profile.name', 'profile.document', 'cpf', 'cnpj'];

    let data = this.users.filter((user) => !user.deletedAt);

    const usesProfiles =
      !!search ||
      Object.keys(filters).some((key) =>
        ['profile.name', 'profile.document', 'cpf', 'cnpj'].includes(key),
      ) ||
      (query?.sort ?? []).some(({ field }) => field === 'profile.name');
    const profiles = usesProfiles
      ? await this.resolveProfileRecords()
      : new Map<string, ProfileRecord | null>();

    const documentFilterKeys = ['profile.document', 'cpf', 'cnpj'];

    for (const [key, rawValue] of Object.entries(filters)) {
      if (!allowedFilters.includes(key)) continue;

      const value = documentFilterKeys.includes(key) && typeof rawValue === 'string'
        ? rawValue.replace(/[.\-/ \s]/g, '')
        : rawValue;
      data = data.filter((user) => this.readField(user, key, profiles) === value);
    }

    if (search) {
      const terms = search.split(/\s+/);
      data = data.filter((user) =>
        terms.some((term: string) =>
          [user.username, user.email, this.readField(user, 'profile.name', profiles)].some((value) =>
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

          const valueA = this.readField(a, field, profiles);
          const valueB = this.readField(b, field, profiles);

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
    return this.users.find((user) => user.email === email && !user.deletedAt) || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.users.find((user) => user.username === username && !user.deletedAt) || null;
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
