import { InvalidRoleAssignmentError } from '@/domain/errors/invalid-role-assignment.error';
import { InvalidUserError } from '@/domain/errors/invalid-user.error';
import { User } from '@/domain/entities/user.entity';

describe('User', () => {
  const props = { username: 'jose', email: 'jose@example.com', password: 'hash', entityType: 'employee' as const, entityId: 'employee-1', roleId: 'role-staff' };

  it('creates a valid user and normalizes email', () => {
    const user = User.create({ ...props, email: 'JOSE@EXAMPLE.COM' });
    expect(user.email).toBe('jose@example.com');
  });

  it('changes password and role', () => {
    const user = User.create(props);
    user.changePassword('new-hash');
    user.changeRole('role-admin', 'admin');
    expect(user.password).toBe('new-hash');
    expect(user.roleId).toBe('role-admin');
  });

  it('does not allow a client to receive an employee role', () => {
    const user = User.create({ ...props, entityType: 'client', roleId: 'role-client' });
    expect(() => user.changeRole('role-admin', 'admin')).toThrow(InvalidRoleAssignmentError);
  });

  it('rejects invalid credentials data', () => {
    expect(() => User.create({ ...props, username: '' })).toThrow(InvalidUserError);
  });
});
