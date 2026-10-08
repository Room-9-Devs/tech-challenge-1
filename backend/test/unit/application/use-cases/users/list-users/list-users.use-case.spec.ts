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

    expect(result.data).toHaveLength(2);
    expect(result.data.map((user) => user.role)).toEqual(expect.arrayContaining(['staff', 'client']));
  });

  it('passes the entity type filter to the repository', async () => {
    const users = new FakeUserRepository();
    await users.save(makeUser({ entityType: 'employee' }));
    await users.save(makeUser({ id: 'client-1', entityType: 'client' }));
    const result = await new ListUsersUseCase(users, new FakeProfileRepository(), new FakeRoleRepository()).execute({ filters: { entityType: 'client' } });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].entityType).toBe('client');
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

    expect(result.data[0].profile).toMatchObject({
      document: '11.222.333/0001-81',
      phone: '(11) 3333-4444',
    });
  });

  const setupSearchableUsers = async () => {
    const profiles = new FakeProfileRepository();
    const quiteria = await profiles.createEmployee({
      id: 'employee-quiteria',
      name: 'Quitéria Dantas',
      documentType: 'CPF',
      document: '12345678901',
      phone: '11999999999',
    });
    const users = new FakeUserRepository(profiles);
    await users.save(
      makeUser({
        id: 'user-quiteria',
        username: 'q.dantas',
        email: 'q.dantas@example.com',
        entityType: 'employee',
        entityId: quiteria.id,
      }),
    );
    await users.save(
      makeUser({
        id: 'user-jeremias',
        username: 'jeremias.lopes',
        email: 'jeremias@example.com',
        entityType: 'employee',
        entityId: 'employee-jeremias',
      }),
    );
    return new ListUsersUseCase(users, profiles, new FakeRoleRepository());
  };

  it('searches users by profile name', async () => {
    const useCase = await setupSearchableUsers();

    const result = await useCase.execute({ search: 'quitéria' });

    expect(result.data.map((user) => user.id)).toEqual(['user-quiteria']);
  });

  it('searches users by username', async () => {
    const useCase = await setupSearchableUsers();

    const result = await useCase.execute({ search: 'jeremias.lopes' });

    expect(result.data.map((user) => user.id)).toEqual(['user-jeremias']);
  });

  it('searches users by email', async () => {
    const useCase = await setupSearchableUsers();

    const result = await useCase.execute({ search: 'jeremias@example' });

    expect(result.data.map((user) => user.id)).toEqual(['user-jeremias']);
  });

  it('returns no users when the search matches nothing', async () => {
    const useCase = await setupSearchableUsers();

    const result = await useCase.execute({ search: 'inexistente' });

    expect(result.data).toEqual([]);
    expect(result.meta.totalItems).toBe(0);
  });

  const setupNamedUsers = async () => {
    const profiles = new FakeProfileRepository();
    const ana = await profiles.createEmployee({
      id: 'employee-ana',
      name: 'Ana Paula',
      documentType: 'CPF',
      document: '11122233344',
      phone: '11999999999',
    });
    const zeca = await profiles.createEmployee({
      id: 'employee-zeca',
      name: 'Zeca Silva',
      documentType: 'CPF',
      document: '55566677788',
      phone: '11988888888',
    });
    const users = new FakeUserRepository(profiles);
    await users.save(
      makeUser({
        id: 'user-ana',
        username: 'ana.paula',
        email: 'ana@example.com',
        entityType: 'employee',
        entityId: ana.id,
      }),
    );
    await users.save(
      makeUser({
        id: 'user-zeca',
        username: 'zeca.silva',
        email: 'zeca@example.com',
        entityType: 'employee',
        entityId: zeca.id,
      }),
    );
    return new ListUsersUseCase(users, profiles, new FakeRoleRepository());
  };

  it('filters users by profile name', async () => {
    const useCase = await setupNamedUsers();

    const result = await useCase.execute({
      filters: { 'profile.name': 'Ana Paula' },
    });

    expect(result.data.map((user) => user.id)).toEqual(['user-ana']);
    expect(result.meta.totalItems).toBe(1);
  });

  it('sorts users by profile name', async () => {
    const useCase = await setupNamedUsers();

    const result = await useCase.execute({
      sort: [{ field: 'profile.name', order: 'desc' }],
    });

    expect(result.data.map((user) => user.id)).toEqual([
      'user-zeca',
      'user-ana',
    ]);
  });
});
