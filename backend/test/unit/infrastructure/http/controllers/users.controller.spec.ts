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
  const makeController = (
    create: unknown = {},
    find: unknown = {},
    list: unknown = {},
    update: unknown = {},
    remove: unknown = {},
  ): UsersController => new UsersController(
    create as never,
    find as never,
    list as never,
    update as never,
    remove as never,
  );

  it('delegates client creation to the use case', async () => {
    const create = {
      execute: jest.fn().mockResolvedValue({ id: 'user-1' }),
    };

    const controller = makeController(create);

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

    const controller = makeController({}, find, list);

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

    const controller = makeController({}, {}, list);

    await controller.findAll({
      sort: JSON.stringify([{ field: 'profile.name', order: 'asc' }]),
      filters: JSON.stringify({ 'profile.name': 'José Silveira' }),
    } as ListUsersQueryDto);

    expect(list.execute).toHaveBeenCalledWith({
      sort: [{ field: 'profile.name', order: 'asc' }],
      filters: { 'profile.name': 'José Silveira' },
    });
  });

  it('allows profile.document, cpf and cnpj in filters', async () => {
    const list = {
      execute: jest.fn().mockResolvedValue({
        data: [],
        meta: { page: 1, limit: 10, totalItems: 0, totalPages: 1 },
      }),
    };

    const controller = makeController({}, {}, list);

    await controller.findAll({
      filters: JSON.stringify({ 'profile.document': '11111111111' }),
    } as ListUsersQueryDto);

    await controller.findAll({
      filters: JSON.stringify({ cpf: '11111111111' }),
    } as ListUsersQueryDto);

    await controller.findAll({
      filters: JSON.stringify({ cnpj: '12345678000199' }),
    } as ListUsersQueryDto);

    expect(list.execute).toHaveBeenCalledWith({
      filters: { 'profile.document': '11111111111' },
    });

    expect(list.execute).toHaveBeenCalledWith({
      filters: { cpf: '11111111111' },
    });

    expect(list.execute).toHaveBeenCalledWith({
      filters: { cnpj: '12345678000199' },
    });
  });

  it('rejects employee creation by staff', async () => {
    
    const create = {execute: jest.fn(),};

    const controller = makeController(create);

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
    const controller = makeController(create);

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

    const controller = makeController(create);

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

    const controller = makeController(create);

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

  it('delegates user update to the use case (PATCH)', async () => {
    const update = {
      execute: jest.fn().mockResolvedValue({ id: 'user-1', username: 'novo' }),
    };

    const controller = makeController({}, {}, {}, update);

    const currentUser: CurrentUser = {
      id: 'admin-1',
      username: 'admin',
      role: 'admin',
      entityType: 'employee',
    };

    const dto = { username: 'novo' } as never;

    await expect(
      controller.update('user-1', dto, currentUser),
    ).resolves.toEqual({ id: 'user-1', username: 'novo' });

    expect(update.execute).toHaveBeenCalledWith({
      id: 'user-1',
      username: 'novo',
      updatedBy: 'admin',
    });
  });

  it('rejects update without current user', async () => {
    const controller = makeController();

    await expect(
      controller.update('user-1', {} as never, undefined as unknown as CurrentUser),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('delegates user deletion to the use case (DELETE)', async () => {
    const remove = {
      execute: jest.fn().mockResolvedValue(undefined),
    };

    const controller = makeController({}, {}, {}, {}, remove);

    const currentUser: CurrentUser = {
      id: 'admin-1',
      username: 'admin',
      role: 'admin',
      entityType: 'employee',
    };

    await expect(
      controller.remove('user-1', currentUser),
    ).resolves.toBeUndefined();

    expect(remove.execute).toHaveBeenCalledWith({
      id: 'user-1',
      deletedBy: 'admin',
    });
  });

  it('rejects deletion without current user', async () => {
    const controller = makeController();

    await expect(
      controller.remove('user-1', undefined as unknown as CurrentUser),
    ).rejects.toThrow(UnauthorizedException);
  });
});