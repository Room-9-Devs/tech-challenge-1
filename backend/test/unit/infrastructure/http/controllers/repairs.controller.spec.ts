import { describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { RepairsController } from '@/infrastructure/http/controllers/repairs.controller';
import { CreateRepairUseCase } from '@/application/use-cases/repairs/create-repair/create-repair.use-case';
import { FindRepairUseCase } from '@/application/use-cases/repairs/find-repair/find-repair.use-case';
import { ListRepairsUseCase } from '@/application/use-cases/repairs/list-repairs/list-repairs.use-case';
import { UpdateRepairUseCase } from '@/application/use-cases/repairs/update-repair/update-repair.use-case';
import { DeleteRepairUseCase } from '@/application/use-cases/repairs/delete-repair/delete-repair.use-case';
import { CreateRepairRequestDto } from '@/infrastructure/http/dtos/create-repair-request.dto';
import { UpdateRepairRequestDto } from '@/infrastructure/http/dtos/update-repair-request.dto';

describe('RepairsController', () => {
  let controller: RepairsController;
  let createRepairUseCase: jest.Mocked<CreateRepairUseCase>;
  let findRepairUseCase: jest.Mocked<FindRepairUseCase>;
  let listRepairsUseCase: jest.Mocked<ListRepairsUseCase>;
  let updateRepairUseCase: jest.Mocked<UpdateRepairUseCase>;
  let deleteRepairUseCase: jest.Mocked<DeleteRepairUseCase>;

  beforeEach(async () => {
    const mockCreateRepairUseCase = { execute: jest.fn() };
    const mockFindRepairUseCase = { execute: jest.fn() };
    const mockListRepairsUseCase = { execute: jest.fn() };
    const mockUpdateRepairUseCase = { execute: jest.fn() };
    const mockDeleteRepairUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RepairsController],
      providers: [
        {
          provide: CreateRepairUseCase,
          useValue: mockCreateRepairUseCase,
        },
        {
          provide: FindRepairUseCase,
          useValue: mockFindRepairUseCase,
        },
        {
          provide: ListRepairsUseCase,
          useValue: mockListRepairsUseCase,
        },
        {
          provide: UpdateRepairUseCase,
          useValue: mockUpdateRepairUseCase,
        },
        {
          provide: DeleteRepairUseCase,
          useValue: mockDeleteRepairUseCase,
        },
      ],
    }).compile();

    controller = module.get<RepairsController>(RepairsController);
    createRepairUseCase = module.get(CreateRepairUseCase);
    findRepairUseCase = module.get(FindRepairUseCase);
    listRepairsUseCase = module.get(ListRepairsUseCase);
    updateRepairUseCase = module.get(UpdateRepairUseCase);
    deleteRepairUseCase = module.get(DeleteRepairUseCase);
  });

  describe('create', () => {
    it('should call CreateRepairUseCase and return the result', async () => {
      const dto: CreateRepairRequestDto = {
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

      createRepairUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.create(dto);

      expect(createRepairUseCase.execute).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findById', () => {
    it('should call FindRepairUseCase and return the result', async () => {
      const id = 'uuid';

      const expectedResult = {
        id,
        description: 'Troca de óleo',
        unitValue: 120.0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      findRepairUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.findById(id);

      expect(findRepairUseCase.execute).toHaveBeenCalledWith({ id });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should call ListRepairsUseCase with query and return the result', async () => {
      const expectedResult = {
        data: [
          {
            id: 'uuid-1',
            description: 'Troca de óleo',
            unitValue: 120.0,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          totalItems: 1,
          totalPages: 1,
        },
      };

      listRepairsUseCase.execute.mockResolvedValue(expectedResult);

      const query = {
        page: 1,
        limit: 10,
        search: undefined,
        sort: '[{"field":"description","order":"asc"}]',
        filters: '{"unitValue":120}',
      };

      const result = await controller.findAll(query);

      expect(listRepairsUseCase.execute).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        sort: [{ field: 'description', order: 'asc' }],
        filters: { unitValue: 120 },
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should call UpdateRepairUseCase and return the result', async () => {
      const id = 'uuid';
      const dto: UpdateRepairRequestDto = {
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

      updateRepairUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.update(id, dto);

      expect(updateRepairUseCase.execute).toHaveBeenCalledWith({
        id,
        ...dto,
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('delete', () => {
    it('should call DeleteRepairUseCase', async () => {
      const id = 'uuid';

      deleteRepairUseCase.execute.mockResolvedValue(undefined);

      await controller.delete(id);

      expect(deleteRepairUseCase.execute).toHaveBeenCalledWith({ id });
    });
  });
});
