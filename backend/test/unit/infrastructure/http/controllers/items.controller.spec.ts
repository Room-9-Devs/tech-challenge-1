import { describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ItemsController } from '@/infrastructure/http/controllers/items.controller';
import { CreateItemUseCase } from '@/application/use-cases/items/create-item/create-item.use-case';
import { ListItemsUseCase } from '@/application/use-cases/items/list-items/list-items.use-case';
import { UpdateItemUseCase } from '@/application/use-cases/items/update-item/update-item.use-case';
import { DeleteItemUseCase } from '@/application/use-cases/items/delete-item/delete-item.use-case';
import { CreateItemRequestDto } from '@/infrastructure/http/dtos/create-item-request.dto';
import { UpdateItemRequestDto } from '@/infrastructure/http/dtos/update-item-request.dto';
import { ItemType, ItemUnit } from '@/domain/entities/item.entity';
import { ItemNotFoundError } from '@/domain/errors/item-not-found.error';
import { ItemHasStockError } from '@/domain/errors/item-has-stock.error';

describe('ItemsController', () => {
  let controller: ItemsController;
  let createItemUseCase: jest.Mocked<CreateItemUseCase>;
  let listItemsUseCase: jest.Mocked<ListItemsUseCase>;
  let updateItemUseCase: jest.Mocked<UpdateItemUseCase>;
  let deleteItemUseCase: jest.Mocked<DeleteItemUseCase>;

  const itemData = {
    sku: 'OLEO-5W30-1L',
    name: 'Óleo 5W30 sintético',
    description: 'Óleo lubrificante sintético',
    itemType: ItemType.CONSUMABLE,
    unit: ItemUnit.LITER,
    cost: 35.9,
    salePrice: 59.9,
  };

  beforeEach(async () => {
    const mockCreateItemUseCase = { execute: jest.fn() };
    const mockListItemsUseCase = { execute: jest.fn() };
    const mockUpdateItemUseCase = { execute: jest.fn() };
    const mockDeleteItemUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItemsController],
      providers: [
        {
          provide: CreateItemUseCase,
          useValue: mockCreateItemUseCase,
        },
        {
          provide: ListItemsUseCase,
          useValue: mockListItemsUseCase,
        },
        {
          provide: UpdateItemUseCase,
          useValue: mockUpdateItemUseCase,
        },
        {
          provide: DeleteItemUseCase,
          useValue: mockDeleteItemUseCase,
        },
      ],
    }).compile();

    controller = module.get<ItemsController>(ItemsController);
    createItemUseCase = module.get(CreateItemUseCase);
    listItemsUseCase = module.get(ListItemsUseCase);
    updateItemUseCase = module.get(UpdateItemUseCase);
    deleteItemUseCase = module.get(DeleteItemUseCase);
  });

  describe('create', () => {
    it('should call CreateItemUseCase and return the result', async () => {
      const dto: CreateItemRequestDto = { ...itemData };

      const expectedResult = {
        id: 'uuid',
        ...itemData,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      createItemUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.create(dto);

      expect(createItemUseCase.execute).toHaveBeenCalledWith(dto);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should call ListItemsUseCase and return the result', async () => {
      const expectedResult = {
        items: [
          {
            id: 'uuid-1',
            ...itemData,
            active: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      };

      listItemsUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.findAll();

      expect(listItemsUseCase.execute).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  describe('update', () => {
    it('should call UpdateItemUseCase and return the result', async () => {
      const id = 'uuid';
      const dto: UpdateItemRequestDto = { ...itemData, salePrice: 69.9 };

      const expectedResult = {
        id,
        ...itemData,
        salePrice: 69.9,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      updateItemUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.update(id, dto);

      expect(updateItemUseCase.execute).toHaveBeenCalledWith({ id, ...dto });
      expect(result).toEqual(expectedResult);
    });

    it('should propagate ItemNotFoundError', async () => {
      updateItemUseCase.execute.mockRejectedValue(
        new ItemNotFoundError('uuid'),
      );

      await expect(controller.update('uuid', { ...itemData })).rejects.toThrow(
        ItemNotFoundError,
      );
    });
  });

  describe('delete', () => {
    it('should call DeleteItemUseCase', async () => {
      const id = 'uuid';

      deleteItemUseCase.execute.mockResolvedValue(undefined);

      await controller.delete(id);

      expect(deleteItemUseCase.execute).toHaveBeenCalledWith({ id });
    });

    it('should propagate ItemHasStockError', async () => {
      deleteItemUseCase.execute.mockRejectedValue(
        new ItemHasStockError('uuid'),
      );

      await expect(controller.delete('uuid')).rejects.toThrow(
        ItemHasStockError,
      );
    });
  });
});
