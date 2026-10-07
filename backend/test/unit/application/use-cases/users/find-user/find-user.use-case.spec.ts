import { FindUserUseCase } from '@/application/use-cases/users/find-user/find-user.use-case';
import { FakeUserRepository } from '../../../../../fakes/fake-user.repository';
import { FakeProfileRepository } from '../../../../../fakes/fake-profile.repository';
import { FakeRoleRepository } from '../../../../../fakes/fake-role.repository';
import { UserNotFoundError } from '@/domain/errors/user-not-found.error';
import { makeUser } from '../../../../../fakes/user-fixture';

describe('FindUserUseCase', () => {
  it('returns the account, role and polymorphic profile', async () => {
    const users = new FakeUserRepository();
    const profiles = new FakeProfileRepository();
    const profile = await profiles.createEmployee({
      name: 'José',
      documentType: 'CPF',
      document: '22222222222',
      phone: '11999999991',
      jobTitle: 'mecânico',
    });
    const user = makeUser({ entityId: profile.id });
    await users.save(user);
    user.changeRole('role-staff', 'staff');
    const result = await new FindUserUseCase(
      users,
      profiles,
      new FakeRoleRepository(),
    ).execute({ id: user.id });

    expect(result.id).toBe(user.id);
    expect(result.role).toBe('staff');
    expect(result.profile).toBeDefined();
    expect(result.profile).toMatchObject({
      document: '222.222.222-22',
      phone: '(11) 99999-9991',
    });
    expect(profile.type).toBe('employee');
  });

  it('returns masked CNPJ profile when querying a client', async () => {
    const users = new FakeUserRepository();
    const profiles = new FakeProfileRepository();
    const profile = await profiles.createClient({
      name: 'Empresa Alpha',
      documentType: 'CNPJ',
      document: '12ABC34501DE35',
      phone: '1133334444',
    });
    const user = makeUser({
      id: 'client-alpha',
      entityType: 'client',
      entityId: profile.id,
      roleId: 'role-client',
    });
    await users.save(user);

    const result = await new FindUserUseCase(
      users,
      profiles,
      new FakeRoleRepository(),
    ).execute({ id: user.id });

    expect(result.profile).toMatchObject({
      document: '12.ABC.345/01DE-35',
      phone: '(11) 3333-4444',
    });
  });

  it('throws when the user does not exist', async () => {
    const useCase = new FindUserUseCase(new FakeUserRepository(), new FakeProfileRepository(), new FakeRoleRepository());
    await expect(useCase.execute({ id: 'missing' })).rejects.toThrow(UserNotFoundError);
  });
});
