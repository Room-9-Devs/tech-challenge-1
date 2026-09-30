import { describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ServiceTypesController } from '@/infrastructure/http/controllers/service-types.controller';
import { CreateServiceTypeUseCase } from '@/application/use-cases/service-types/create-service-type/create-service-type.use-case';
import { FindServiceTypeUseCase } from '@/application/use-cases/service-types/find-service-type/find-service-type.use-case';
import { ListServiceTypesUseCase } from '@/application/use-cases/service-types/list-service-types/list-service-types.use-case';
import { UpdateServiceTypeUseCase } from '@/application/use-cases/service-types/update-service-type/update-service-type.use-case';
import { DeleteServiceTypeUseCase } from '@/application/use-cases/service-types/delete-service-type/delete-service-type.use-case';
import { CreateServiceTypeRequestDto } from '@/infrastructure/http/dtos/create-service-type-request.dto';
import { UpdateServiceTypeRequestDto } from '@/infrastructure/http/dtos/update-service-type-request.dto';

describe('ServiceTypesController', () => {
  let controller: ServiceTypesController;
  let createServiceTypeUseCase: jest.Mocked<CreateServiceTypeUseCase>;
  let findServiceTypeUseCase: jest.Mocked<FindServiceTypeUseCase>;
  let listServiceTypesUseCase: jest.Mocked<ListServiceTypesUseCase>;
  let updateServiceTypeUseCase: jest.Mocked<UpdateServiceTypeUseCase>;
  let deleteServiceTypeUseCase: jest.Mocked<DeleteServiceTypeUseCase>;

  beforeEach(async () => {
    const mockCreateServiceTypeUseCase = { execute: jest.fn() };
    const mockFindServiceTypeUseCase = { execute: jest.fn() };
    const mockListServiceTypesUseCase = { execute: jest.fn() };
    const mockUpdateServiceTypeUseCase = { execute: jest.fn() };
    const mockDeleteServiceTypeUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceTypesController],
      providers: [
        {
          provide: CreateServiceTypeUseCase,
          useValue: mockCreateServiceTypeUseCase,
        },
        {
          provide: FindServiceTypeUseCase,
          useValue: mockFindServiceTypeUseCase,
        },
        {
          provide: ListServiceTypesUseCase,
          useValue: mockListServiceTypesUseCase,
        },
        {
          provide: UpdateServiceTypeUseCase,
          useValue: mockUpdateServiceTypeUseCase,
        },
        {
          provide: DeleteServiceTypeUseCase,
          useValue: mockDeleteServiceTypeUseCase,
        },
      ],
    }).compile();

    controller = module.get<ServiceTypesController>(ServiceTypesController);
    createServiceTypeUseCase = module.get(CreateServiceTypeUseCase);
    findServiceTypeUseCase = module.get(FindServiceTypeUseCase);
    listServiceTypesUseCase = module.get(ListServiceTypesUseCase);
    updateServiceTypeUseCase = module.get(UpdateServiceTypeUseCase);
    deleteServiceTypeUseCase = module.get(DeleteServiceTypeUseCase);
  });

  describe('create', () => {
    it('should call CreateServiceTypeUseCase and return the result', async () => {
      const dto: CreateServiceTypeRequestDto = {
        description: 'Troca de óleo',
        unitValue: 120.0,
      };

      const expectedResult = {
        id: 'uuid',
        description: 'Troca de óleo',
        unitValue: 120.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      createServiceTypeUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.create(dto);

      expect(createServiceTypeUseCase.execute).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findById', () => {
    it('should call FindServiceTypeUseCase and return the result', async () => {
      const id = 'uuid';

      const expectedResult = {
        id,
        description: 'Troca de óleo',
        unitValue: 120.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      findServiceTypeUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.findById(id);

      expect(findServiceTypeUseCase.execute).toHaveBeenCalledWith({ id });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should call ListServiceTypesUseCase and return the result', async () => {
      const expectedResult = {
        serviceTypes: [
          {
            id: 'uuid-1',
            description: 'Troca de óleo',
            unitValue: 120.0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      listServiceTypesUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(listServiceTypesUseCase.execute).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should call UpdateServiceTypeUseCase and return the result', async () => {
      const id = 'uuid';
      const dto: UpdateServiceTypeRequestDto = {
        description: 'Troca de óleo sintético',
        unitValue: 150.0,
      };

      const expectedResult = {
        id,
        description: 'Troca de óleo sintético',
        unitValue: 150.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      updateServiceTypeUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.update(id, dto);

      expect(updateServiceTypeUseCase.execute).toHaveBeenCalledWith({
        id,
        ...dto,
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('delete', () => {
    it('should call DeleteServiceTypeUseCase', async () => {
      const id = 'uuid';

      deleteServiceTypeUseCase.execute.mockResolvedValue(undefined);

      await controller.delete(id);

      expect(deleteServiceTypeUseCase.execute).toHaveBeenCalledWith({ id });
    });
  });
});
