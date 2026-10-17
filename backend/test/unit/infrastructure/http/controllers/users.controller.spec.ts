import { UsersController } from '@/infrastructure/http/controllers/users.controller';
import { CreateUserRequestDto } from '@/infrastructure/http/dtos/create-user-request.dto';
import { ListUsersQueryDto } from '@/infrastructure/http/dtos/list-users-query.dto';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { CurrentUser } from '@/infrastructure/http/auth/current-user.type';
import { FindCurrentUserUseCase } from '@/application/use-cases/users/find-current-user/find-current-user.use-case';
import { FakeUserRepository } from '../../../../fakes/fake-user.repository';
import { FakeRoleRepository } from '../../../../fakes/fake-role.repository';
import { makeUser } from '../../../../fakes/user-fixture';

describe('UsersController', () => {
  it('delegates client creation to the use case', async () => {
    const create = {
      execute: jest.fn().mockResolvedValue({ id: 'user-1' }),
    };

    const controller = new UsersController(
      create as never,
      {} as never,
      {} as never,
    );

    const input = {
      username: 'cliente',
      email: 'cliente@example.com',
      password: 'password123',
      entityType: 'client',
      name: 'Cliente',
      documentType: 'CPF',
      document: '11111111111',
      phone: '11999999999',
    } as CreateUserRequestDto;

    const currentUser: CurrentUser = {
      id: 'admin-1',
      username: 'admin',
      role: 'admin',
      entityType: 'employee',
    };

    await expect(controller.create(input, currentUser)).resolves.toEqual({
      id: 'user-1',
    });

    expect(create.execute).toHaveBeenCalledWith({ ...input, createdBy: 'admin' });
  });

  it('delegates me, find and list operations', async () => {
    const find = {
      execute: jest.fn().mockResolvedValue({ id: 'user-1' }),
    };

    const list = {
      execute: jest.fn().mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, totalItems: 0, totalPages: 1 },
      }),
    };

    const controller = new UsersController(
      {} as never,
      find as never,
      list as never,
    );

    await controller.me({ user: { sub: 'user-1' } });
    await controller.findById('user-2');
    await controller.findAll({
      filters: JSON.stringify({ entityType: 'client' }),
    } as ListUsersQueryDto);
    await controller.findAll({} as ListUsersQueryDto);

    expect(find.execute).toHaveBeenNthCalledWith(1, { id: 'user-1' });
    expect(find.execute).toHaveBeenNthCalledWith(2, { id: 'user-2' });

    expect(list.execute).toHaveBeenCalledWith({
      filters: { entityType: 'client' },
    });

    expect(list.execute).toHaveBeenCalledWith({
      filters: undefined,
    });
  });

  it('allows profile.name in sort and filters', async () => {
    const list = {
      execute: jest.fn().mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, totalItems: 0, totalPages: 1 },
      }),
    };

    const controller = new UsersController(
      {} as never,
      {} as never,
      list as never,
    );

    await controller.findAll({
      sort: JSON.stringify([{ field: 'profile.name', order: 'asc' }]),
      filters: JSON.stringify({ 'profile.name': 'José Silveira' }),
    } as ListUsersQueryDto);

    expect(list.execute).toHaveBeenCalledWith({
      sort: [{ field: 'profile.name', order: 'asc' }],
      filters: { 'profile.name': 'José Silveira' },
    });
  });

  it('rejects employee creation by staff', async () => {
    
    const create = {execute: jest.fn(),};

    const controller = new UsersController(
      create as never,
      {} as never,
      {} as never,
    );

    const input = {
      entityType: 'employee',
    } as CreateUserRequestDto;

    const currentUser: CurrentUser = {
      id: 'staff-1',
      username: 'staff',
      role: 'staff',
      entityType: 'employee',
    };

    await expect(
      controller.create(input, currentUser),
    ).rejects.toThrow(ForbiddenException);

    expect(create.execute).not.toHaveBeenCalled();
  });

  it('rejects employee creation when the real current user resolves to staff (regression USR-1)', async () => {
    const users = new FakeUserRepository();
    await users.save(makeUser({ id: 'staff-1', username: 'staff', roleId: 'role-staff' }));

    const findCurrentUser = new FindCurrentUserUseCase(users, new FakeRoleRepository());

    const create = { execute: jest.fn() };
    const controller = new UsersController(
      create as never,
      {} as never,
      {} as never,
    );

    const currentUser = await findCurrentUser.execute('staff-1');
    const input = {
      entityType: 'employee',
    } as CreateUserRequestDto;

    expect(currentUser?.role).toBe('staff');

    await expect(
      controller.create(input, currentUser as CurrentUser),
    ).rejects.toThrow(ForbiddenException);

    expect(create.execute).not.toHaveBeenCalled();
  });

  it('rejects creation when there is no current user', async () => {
    const create = { execute: jest.fn() };

    const controller = new UsersController(
      create as never,
      {} as never,
      {} as never,
    );

    const input = {
      username: 'cliente',
      email: 'cliente@example.com',
      password: 'password123',
      entityType: 'client',
      name: 'Cliente',
      documentType: 'CPF',
      document: '11111111111',
      phone: '11999999999',
    } as CreateUserRequestDto;

    await expect(
      controller.create(input, undefined as unknown as CurrentUser),
    ).rejects.toThrow(UnauthorizedException);

    expect(create.execute).not.toHaveBeenCalled();
  });

  it('allows administrator to create an employee', async () => {
    const create = {
      execute: jest.fn().mockResolvedValue({ id: 'employee-1' }),
    };

    const controller = new UsersController(
      create as never,
      {} as never,
      {} as never,
    );

    const input = {
      entityType: 'employee',
    } as CreateUserRequestDto;

    const currentUser: CurrentUser = {
      id: 'admin-1',
      username: 'admin',
      role: 'admin',
      entityType: 'employee',
    };

    await expect(controller.create(input, currentUser)).resolves.toEqual({
      id: 'employee-1',
    });

    expect(create.execute).toHaveBeenCalledWith({ ...input, createdBy: 'admin' });
  });
});