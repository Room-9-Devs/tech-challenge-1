import { describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '@/infrastructure/http/controllers/users.controller';
import { CreateUserUseCase } from '@/application/use-cases/users/create-user/create-user.use-case';
import { FindUserUseCase } from '@/application/use-cases/users/find-user/find-user.use-case';
import { ListUsersUseCase } from '@/application/use-cases/users/list-users/list-users.use-case';
import { CreateUserRequestDto } from '@/infrastructure/http/dtos/create-user-request.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let createUserUseCase: jest.Mocked<CreateUserUseCase>;
  let findUserUseCase: jest.Mocked<FindUserUseCase>;
  let listUsersUseCase: jest.Mocked<ListUsersUseCase>;

  beforeEach(async () => {
    const mockCreateUserUseCase = {
      execute: jest.fn(),
    };

    const mockFindUserUseCase = {
      execute: jest.fn(),
    };

    const mockListUsersUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: CreateUserUseCase,
          useValue: mockCreateUserUseCase,
        },
        {
          provide: FindUserUseCase,
          useValue: mockFindUserUseCase,
        },
        {
          provide: ListUsersUseCase,
          useValue: mockListUsersUseCase,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    createUserUseCase = module.get(CreateUserUseCase);
    findUserUseCase = module.get(FindUserUseCase);
    listUsersUseCase = module.get(ListUsersUseCase);
  });

  describe('create', () => {
    it('should call CreateUserUseCase and return the result', async () => {
      const dto: CreateUserRequestDto = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const expectedResult = {
        id: 'uuid',
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      createUserUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.create(dto);

      expect(createUserUseCase.execute).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findById', () => {
    it('should call FindUserUseCase and return the result', async () => {
      const id = 'uuid';

      const expectedResult = {
        id,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      findUserUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.findById(id);

      expect(findUserUseCase.execute).toHaveBeenCalledWith({ id });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should call ListUsersUseCase and return the result', async () => {
      const expectedResult = {
        users: [
          {
            id: 'uuid-1',
            name: 'John Doe',
            email: 'john@example.com',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      listUsersUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(listUsersUseCase.execute).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });
});
