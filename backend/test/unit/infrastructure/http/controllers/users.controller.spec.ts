import { UsersController } from '@/infrastructure/http/controllers/users.controller';
import { CreateUserRequestDto } from '@/infrastructure/http/dtos/create-user-request.dto';
import { ForbiddenException } from '@nestjs/common';

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

    const request = {
      user: {
        role: 'admin',
      },
    };

    await expect(controller.create(input, request)).resolves.toEqual({
      id: 'user-1',
    });

    expect(create.execute).toHaveBeenCalledWith(input);
  });

  it('delegates me, find and list operations', async () => {
    const find = {
      execute: jest.fn().mockResolvedValue({ id: 'user-1' }),
    };

    const list = {
      execute: jest.fn().mockResolvedValue({ users: [] }),
    };

    const controller = new UsersController(
      {} as never,
      find as never,
      list as never,
    );

    await controller.me({ user: { sub: 'user-1' } });
    await controller.findById('user-2');
    await controller.findAll('client');
    await controller.findAll();

    expect(find.execute).toHaveBeenNthCalledWith(1, { id: 'user-1' });
    expect(find.execute).toHaveBeenNthCalledWith(2, { id: 'user-2' });

    expect(list.execute).toHaveBeenCalledWith({
      entityType: 'client',
    });

    expect(list.execute).toHaveBeenCalledWith({
      entityType: undefined,
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

    const request = {
      user: {
        role: 'staff',
      },
    };

    await expect(
      controller.create(input, request),
    ).rejects.toThrow(ForbiddenException);

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

    const request = {
      user: {
        role: 'admin',
      },
    };

    await expect(controller.create(input, request)).resolves.toEqual({
      id: 'employee-1',
    });

    expect(create.execute).toHaveBeenCalledWith(input);
  });
});