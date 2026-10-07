import { ListUsersUseCase } from '@/application/use-cases/users/list-users/list-users.use-case';
import { FakeUserRepository } from '../../../../../fakes/fake-user.repository';
import { FakeProfileRepository } from '../../../../../fakes/fake-profile.repository';
import { FakeRoleRepository } from '../../../../../fakes/fake-role.repository';
import { makeUser } from '../../../../../fakes/user-fixture';

describe('ListUsersUseCase', () => {
  it('lists users with their roles and profiles', async () => {
    const users = new FakeUserRepository();
    await users.save(makeUser({ id: 'employee-1', entityType: 'employee', roleId: 'role-staff' }));
    await users.save(makeUser({ id: 'client-1', username: 'client', email: 'client@example.com', entityType: 'client', entityId: 'client-profile', roleId: 'role-client' }));
    const result = await new ListUsersUseCase(users, new FakeProfileRepository(), new FakeRoleRepository()).execute();

    expect(result.users).toHaveLength(2);
    expect(result.users.map((user) => user.role)).toEqual(expect.arrayContaining(['staff', 'client']));
  });

  it('passes the entity type filter to the repository', async () => {
    const users = new FakeUserRepository();
    await users.save(makeUser({ entityType: 'employee' }));
    await users.save(makeUser({ id: 'client-1', entityType: 'client' }));
    const result = await new ListUsersUseCase(users, new FakeProfileRepository(), new FakeRoleRepository()).execute({ entityType: 'client' });

    expect(result.users).toHaveLength(1);
    expect(result.users[0].entityType).toBe('client');
  });

  it('masks profile document and phone in the list output', async () => {
    const users = new FakeUserRepository();
    const profiles = new FakeProfileRepository();
    const clientProfile = await profiles.createClient({
      id: 'client-profile-1',
      name: 'Maria',
      documentType: 'CNPJ',
      document: '11222333000181',
      phone: '1133334444',
    });
    await users.save(
      makeUser({
        id: 'user-client-1',
        entityType: 'client',
        entityId: clientProfile.id,
      }),
    );

    const result = await new ListUsersUseCase(
      users,
      profiles,
      new FakeRoleRepository(),
    ).execute();

    expect(result.users[0].profile).toMatchObject({
      document: '11.222.333/0001-81',
      phone: '(11) 3333-4444',
    });
  });
});
