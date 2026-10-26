import { User, UserEntityType } from '@/domain/entities/user.entity';

export function makeUser(overrides: Partial<{
  id: string;
  username: string;
  email: string;
  password: string;
  entityType: UserEntityType;
  entityId: string;
  roleId: string;
  deletedAt: Date | null;
}> = {}): User {
  return User.reconstitute({
    id: overrides.id || 'user-1',
    username: overrides.username || 'jose.silveira',
    email: overrides.email || 'jose@example.com',
    password: overrides.password || 'hash:password123',
    entityType: overrides.entityType || 'employee',
    entityId: overrides.entityId || 'employee-1',
    roleId: overrides.roleId || 'role-staff',
    deletedAt: overrides.deletedAt ?? null,
  });
}
