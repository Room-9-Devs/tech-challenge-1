import { ChangeRoleUseCase } from '@/application/use-cases/permissions/change-role.use-case';
import { FakeRoleRepository } from '../../../../fakes/fake-role.repository';
import { FakeUserRepository } from '../../../../fakes/fake-user.repository';
import { makeUser } from '../../../../fakes/user-fixture';
import { InvalidRoleAssignmentError } from '@/domain/errors/invalid-role-assignment.error';

describe('ChangeRoleUseCase', () => {
  it('promotes an employee to admin', async () => {
    const users = new FakeUserRepository();
    const user = makeUser({ entityType: 'employee', roleId: 'role-staff' });
    await users.save(user);
    await new ChangeRoleUseCase(users, new FakeRoleRepository()).execute(user.id, ' ADMIN ');

    expect((await users.findById(user.id))?.roleId).toBe('role-admin');
  });

  it('does not assign an administrative role to a client', async () => {
    const users = new FakeUserRepository();
    const user = makeUser({ entityType: 'client', entityId: 'client-1', roleId: 'role-client' });
    await users.save(user);

    await expect(new ChangeRoleUseCase(users, new FakeRoleRepository()).execute(user.id, 'admin')).rejects.toThrow(InvalidRoleAssignmentError);
  });
});
