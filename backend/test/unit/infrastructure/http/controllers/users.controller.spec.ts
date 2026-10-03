import { UsersController } from '@/infrastructure/http/controllers/users.controller';
import { CreateUserRequestDto } from '@/infrastructure/http/dtos/create-user-request.dto';
import { BadRequestException } from '@nestjs/common';

describe('UsersController', () => {
  it('delegates client creation to the use case', async () => {
    const create = { execute: jest.fn().mockResolvedValue({ id: 'user-1' }) };
    const controller = new UsersController(create as never, {} as never, {} as never);
    const input = {
      username: 'cliente', email: 'cliente@example.com', password: 'password123', entityType: 'client',
      name: 'Cliente', documentType: 'CPF', document: '11111111111', phone: '11999999999',
    } as CreateUserRequestDto;

    await expect(controller.create(input)).resolves.toEqual({ id: 'user-1' });
    expect(create.execute).toHaveBeenCalledWith(input);
  });

  it('delegates me, find and list operations', async () => {
    const find = { execute: jest.fn().mockResolvedValue({ id: 'user-1' }) };
    const list = { execute: jest.fn().mockResolvedValue({ users: [] }) };
    const controller = new UsersController({} as never, find as never, list as never);

    await controller.me({ user: { sub: 'user-1' } });
    await controller.findById('user-2');
    await controller.findAll('client');
    await controller.findAll();

    expect(find.execute).toHaveBeenNthCalledWith(1, { id: 'user-1' });
    expect(find.execute).toHaveBeenNthCalledWith(2, { id: 'user-2' });
    expect(list.execute).toHaveBeenCalledWith({ entityType: 'client' });
    expect(list.execute).toHaveBeenCalledWith({ entityType: undefined });
  });

  it('rejects employee creation on the public endpoint', async () => {
    const create = { execute: jest.fn() };
    const controller = new UsersController(create as never, {} as never, {} as never);
    await expect(controller.create({ entityType: 'employee' } as CreateUserRequestDto)).rejects.toThrow(BadRequestException);
  });

  it('delegates administrator employee creation', async () => {
    const create = { execute: jest.fn().mockResolvedValue({ id: 'employee-1' }) };
    const controller = new UsersController(create as never, {} as never, {} as never);
    const input = { entityType: 'employee' } as CreateUserRequestDto;
    await expect(controller.createEmployee(input)).resolves.toEqual({ id: 'employee-1' });
    expect(create.execute).toHaveBeenCalledWith(input);
    await expect(controller.createEmployee({ entityType: 'client' } as CreateUserRequestDto)).rejects.toThrow(BadRequestException);
  });
});
