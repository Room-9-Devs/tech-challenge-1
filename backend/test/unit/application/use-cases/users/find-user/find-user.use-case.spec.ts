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
    const user = makeUser();
    await users.save(user);
    const profile = await profiles.createEmployee({ name: 'José', documentType: 'CPF', document: '22222222222', phone: '11999999991', jobTitle: 'mecânico' });
    user.changeRole('role-staff', 'staff');
    const result = await new FindUserUseCase(users, profiles, new FakeRoleRepository()).execute({ id: user.id });

    expect(result.id).toBe(user.id);
    expect(result.role).toBe('staff');
    expect(result.profile).toBeDefined();
    expect(profile.type).toBe('employee');
  });

  it('throws when the user does not exist', async () => {
    const useCase = new FindUserUseCase(new FakeUserRepository(), new FakeProfileRepository(), new FakeRoleRepository());
    await expect(useCase.execute({ id: 'missing' })).rejects.toThrow(UserNotFoundError);
  });
});
