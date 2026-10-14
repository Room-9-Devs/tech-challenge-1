import { FindCurrentUserUseCase } from '@/application/use-cases/users/find-current-user/find-current-user.use-case';
import { FakeUserRepository } from '../../../../../fakes/fake-user.repository';
import { FakeRoleRepository } from '../../../../../fakes/fake-role.repository';
import { makeUser } from '../../../../../fakes/user-fixture';

describe('FindCurrentUserUseCase', () => {
  it('returns the role slug for an existing user', async () => {
    const users = new FakeUserRepository();
    await users.save(makeUser({ id: 'staff-1', username: 'staff', roleId: 'role-staff' }));

    const result = await new FindCurrentUserUseCase(users, new FakeRoleRepository()).execute('staff-1');

    expect(result).toEqual({
      id: 'staff-1',
      username: 'staff',
      role: 'staff',
      entityType: 'employee',
    });
  });

  it('returns the admin slug for an administrator', async () => {
    const users = new FakeUserRepository();
    await users.save(makeUser({ id: 'admin-1', username: 'admin', roleId: 'role-admin' }));

    const result = await new FindCurrentUserUseCase(users, new FakeRoleRepository()).execute('admin-1');

    expect(result?.role).toBe('admin');
  });

  it('falls back to the role id when the role does not exist', async () => {
    const users = new FakeUserRepository();
    await users.save(makeUser({ id: 'orphan-1', roleId: 'missing-role' }));

    const result = await new FindCurrentUserUseCase(users, new FakeRoleRepository()).execute('orphan-1');

    expect(result?.role).toBe('missing-role');
  });

  it('returns null when the user does not exist', async () => {
    const result = await new FindCurrentUserUseCase(
      new FakeUserRepository(),
      new FakeRoleRepository(),
    ).execute('missing');

    expect(result).toBeNull();
  });
});
