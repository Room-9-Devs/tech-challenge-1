import { PermissionsController } from '@/infrastructure/http/permissions/permissions.controller';

describe('PermissionsController', () => {
  it('lists roles through the use case', async () => {
    const listRoles = { execute: jest.fn().mockResolvedValue([{ id: 'role-client', name: 'Cliente', slug: 'client' }]) };
    const changeRole = { execute: jest.fn() };
    const controller = new PermissionsController(listRoles as never, changeRole as never);

    await expect(controller.listRoles()).resolves.toEqual([{ id: 'role-client', name: 'Cliente', slug: 'client' }]);
    expect(listRoles.execute).toHaveBeenCalled();
  });

  it('changes a user role through the use case', async () => {
    const listRoles = { execute: jest.fn() };
    const changeRole = { execute: jest.fn().mockResolvedValue(undefined) };
    const controller = new PermissionsController(listRoles as never, changeRole as never);

    await controller.changeRole('user-1', { role: 'admin' });
    expect(changeRole.execute).toHaveBeenCalledWith('user-1', 'admin');
  });
});
