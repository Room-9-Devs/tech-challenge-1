import { ChangeRoleUseCase } from '@/application/use-cases/permissions/change-role.use-case';
import { FakeRoleRepository } from '../../../../fakes/fake-role.repository';
import { FakeUserRepository } from '../../../../fakes/fake-user.repository';
import { makeUser } from '../../../../fakes/user-fixture';
import { InvalidRoleAssignmentError } from '@/domain/errors/invalid-role-assignment.error';
import { UserNotFoundError } from '@/domain/errors/user-not-found.error';
import { RoleNotFoundError } from '@/domain/errors/role-not-found.error';
import { FakeDomainEventPublisher } from '../../../../fakes/fake-domain-event-publisher';
import { UserRoleChangedEvent } from '@/domain/events/user.events';

describe('ChangeRoleUseCase', () => {
  it('promotes an employee to admin', async () => {
    const users = new FakeUserRepository();
    const user = makeUser({ entityType: 'employee', roleId: 'role-staff' });
    await users.save(user);
    await new ChangeRoleUseCase(users, new FakeRoleRepository(), new FakeDomainEventPublisher()).execute(user.id, ' ADMIN ', 'rita.admin');

    expect((await users.findById(user.id))?.roleId).toBe('role-admin');
  });

  it('records the acting admin as the audit author, not the target user (regression USR-3)', async () => {
    const users = new FakeUserRepository();
    const publisher = new FakeDomainEventPublisher();
    const user = makeUser({ entityType: 'employee', roleId: 'role-staff', username: 'jose.silveira' });
    await users.save(user);

    await new ChangeRoleUseCase(users, new FakeRoleRepository(), publisher).execute(user.id, 'admin', 'rita.admin');

    const events = publisher.getPublishedEvents();
    expect(events).toHaveLength(1);
    const [event] = events as UserRoleChangedEvent[];
    expect(event.eventType).toBe('user.role_changed');
    expect(event.entityId).toBe(user.id);
    expect(event.createdBy).toBe('rita.admin');
    expect(event.createdBy).not.toBe(user.username);
    expect(event.metadata).toEqual({ oldRole: 'staff', newRole: 'admin' });
  });

  it('does not assign an administrative role to a client', async () => {
    const users = new FakeUserRepository();
    const user = makeUser({ entityType: 'client', entityId: 'client-1', roleId: 'role-client' });
    await users.save(user);

    await expect(new ChangeRoleUseCase(users, new FakeRoleRepository(), new FakeDomainEventPublisher()).execute(user.id, 'admin', 'rita.admin')).rejects.toThrow(InvalidRoleAssignmentError);
  });

  it('rejects a missing user or role', async () => {
    const users = new FakeUserRepository();
    const roles = new FakeRoleRepository();
    const useCase = new ChangeRoleUseCase(users, roles, new FakeDomainEventPublisher());
    await expect(useCase.execute('missing', 'staff', 'rita.admin')).rejects.toThrow(UserNotFoundError);
    await users.save(makeUser());
    await expect(useCase.execute('user-1', 'unknown', 'rita.admin')).rejects.toThrow(RoleNotFoundError);
  });
});
