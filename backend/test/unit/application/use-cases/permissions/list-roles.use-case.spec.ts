import { ListRolesUseCase } from '@/application/use-cases/permissions/list-roles.use-case';
import { FakeRoleRepository } from '../../../../fakes/fake-role.repository';

describe('ListRolesUseCase', () => {
  it('returns the available roles', async () => {
    const roles = await new ListRolesUseCase(new FakeRoleRepository()).execute();
    expect(roles.map((role) => role.slug)).toEqual(['admin', 'staff', 'client']);
  });
});
