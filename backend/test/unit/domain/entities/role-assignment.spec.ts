import { User } from '@/domain/entities/user.entity';
import { InvalidRoleAssignmentError } from '@/domain/errors/invalid-role-assignment.error';

describe('User role assignment policy', () => {
  it('allows staff and admin roles for employees', () => {
    const user = User.create({ username: 'staff', email: 'staff@example.com', password: 'hash', entityType: 'employee', entityId: 'employee-1', roleId: 'role-staff' });
    expect(() => user.changeRole('role-admin', 'admin')).not.toThrow();
  });

  it('allows only client role for clients', () => {
    const user = User.create({ username: 'client', email: 'client@example.com', password: 'hash', entityType: 'client', entityId: 'client-1', roleId: 'role-client' });
    expect(() => user.changeRole('role-staff', 'staff')).toThrow(InvalidRoleAssignmentError);
  });
});
