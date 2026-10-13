import { describe, it, expect, beforeEach } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';
import { StockController } from '@/infrastructure/http/controllers/stock.controller';
import { ListStockUseCase } from '@/application/use-cases/stock/list-stock/list-stock.use-case';
import { CreateStockMovementUseCase } from '@/application/use-cases/stock/create-stock-movement/create-stock-movement.use-case';
import { ListStockMovementsUseCase } from '@/application/use-cases/stock/list-stock-movements/list-stock-movements.use-case';
import { CreateStockMovementRequestDto } from '@/infrastructure/http/dtos/create-stock-movement-request.dto';
import { AccessTokenPayload } from '@/application/ports/token-service.port';
import { ProductType, ProductUnit } from '@/domain/entities/product.entity';
import { StockMovementType } from '@/domain/entities/stock-movement.entity';
import { ProductNotFoundError } from '@/domain/errors/product-not-found.error';
import { InsufficientStockError } from '@/domain/errors/insufficient-stock.error';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '@/infrastructure/http/auth/jwt-auth.guard';
import { RolesGuard } from '@/infrastructure/http/auth/roles.guard';
import { ROLES_KEY } from '@/infrastructure/http/auth/roles.decorator';
import { CurrentUserInterceptor } from '@/infrastructure/http/auth/current-user.interceptor';
import { FindCurrentUserUseCase } from '@/application/use-cases/users/find-current-user/find-current-user.use-case';
import { CurrentUser } from '@/infrastructure/http/auth/current-user.type';

describe('StockController', () => {
  let controller: StockController;
  let listStockUseCase: jest.Mocked<ListStockUseCase>;
  let createStockMovementUseCase: jest.Mocked<CreateStockMovementUseCase>;
  let listStockMovementsUseCase: jest.Mocked<ListStockMovementsUseCase>;

  const productId = '550e8400-e29b-41d4-a716-446655440000';
  const userId = '660e8400-e29b-41d4-a716-446655440000';

  const request = {
    user: { sub: userId, role: 'staff', entityType: 'employee' },
  } as Request & { user: AccessTokenPayload };

  const currentUser: CurrentUser = {
    id: userId,
    username: 'quiteria.dantas',
    role: 'staff',
    entityType: 'employee',
  };

  beforeEach(async () => {
    const mockListStockUseCase = { execute: jest.fn() };
    const mockCreateStockMovementUseCase = { execute: jest.fn() };
    const mockListStockMovementsUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StockController],
      providers: [
        {
          provide: ListStockUseCase,
          useValue: mockListStockUseCase,
        },
        {
          provide: CreateStockMovementUseCase,
          useValue: mockCreateStockMovementUseCase,
        },
        {
          provide: ListStockMovementsUseCase,
          useValue: mockListStockMovementsUseCase,
        },
        {
          provide: FindCurrentUserUseCase,
          useValue: { execute: jest.fn().mockResolvedValue(currentUser) },
        },
        CurrentUserInterceptor,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<StockController>(StockController);
    listStockUseCase = module.get(ListStockUseCase);
    createStockMovementUseCase = module.get(CreateStockMovementUseCase);
    listStockMovementsUseCase = module.get(ListStockMovementsUseCase);
  });

  describe('authorization', () => {
    it('should require authentication and admin or staff role', () => {
      expect(Reflect.getMetadata(GUARDS_METADATA, StockController)).toEqual([
        JwtAuthGuard,
        RolesGuard,
      ]);
      expect(Reflect.getMetadata(ROLES_KEY, StockController)).toEqual([
        'admin',
        'staff',
      ]);
    });
  });

  describe('findAll', () => {
    it('should call ListStockUseCase with query and return the result', async () => {
      const expectedResult = {
        data: [
          {
            id: 'stock-uuid',
            productId,
            product: {
              id: productId,
              sku: 'OLEO-5W30-1L',
              name: 'Óleo 5W30 sintético',
              productType: ProductType.CONSUMABLE,
              unit: ProductUnit.LITER,
            },
            quantity: 50,
            reserved: 0,
            available: 50,
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

      listStockUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.findAll({
        page: 1,
        limit: 10,
        search: undefined,
        sort: '[{"field":"quantity","order":"asc"}]',
        filters: `{"productId":"${productId}"}`,
      });

      expect(listStockUseCase.execute).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        sort: [{ field: 'quantity', order: 'asc' }],
        filters: { productId },
      });
      expect(result).toEqual(expectedResult);
    });

    it('should reject filters that are not allowed', async () => {
      await expect(
        controller.findAll({ filters: '{"quantity":10}' }),
      ).rejects.toThrow(BadRequestException);
      expect(listStockUseCase.execute).not.toHaveBeenCalled();
    });

    it('should reject productId filter that is not a UUID', async () => {
      await expect(
        controller.findAll({ filters: '{"productId":"invalid"}' }),
      ).rejects.toThrow(BadRequestException);
      expect(listStockUseCase.execute).not.toHaveBeenCalled();
    });

    it('should reject sort fields that are not allowed', async () => {
      await expect(
        controller.findAll({ sort: '[{"field":"product","order":"asc"}]' }),
      ).rejects.toThrow(BadRequestException);
      expect(listStockUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('findMovements', () => {
    it('should call ListStockMovementsUseCase with query and return the result', async () => {
      const expectedResult = {
        data: [
          {
            id: 'movement-uuid',
            productId,
            product: {
              id: productId,
              sku: 'OLEO-5W30-1L',
              name: 'Óleo 5W30 sintético',
              productType: ProductType.CONSUMABLE,
              unit: ProductUnit.LITER,
            },
            movementType: StockMovementType.OUT,
            quantity: 4,
            previousQuantity: 10,
            description: null,
            referenceType: null,
            referenceId: null,
            createdBy: userId,
            createdAt: new Date(),
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          totalItems: 1,
          totalPages: 1,
        },
      };

      listStockMovementsUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.findMovements({
        page: 1,
        limit: 10,
        search: undefined,
        sort: '[{"field":"createdAt","order":"asc"}]',
        filters: `{"productId":"${productId}","movementType":"OUT","createdBy":"${userId}"}`,
        startDate: '2026-10-01T00:00:00.000Z',
        endDate: '2026-10-31T23:59:59.999Z',
      });

      expect(listStockMovementsUseCase.execute).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        sort: [{ field: 'createdAt', order: 'asc' }],
        filters: { productId, movementType: 'OUT', createdBy: userId },
        startDate: new Date('2026-10-01T00:00:00.000Z'),
        endDate: new Date('2026-10-31T23:59:59.999Z'),
      });
      expect(result).toEqual(expectedResult);
    });

    it.each([
      ['a filter that is not allowed', { filters: '{"quantity":10}' }],
      ['a productId that is not a UUID', { filters: '{"productId":"invalid"}' }],
      ['a createdBy that is not a UUID', { filters: '{"createdBy":"invalid"}' }],
      ['an unknown movementType', { filters: '{"movementType":"TRANSFER"}' }],
      ['a sort field that is not allowed', { sort: '[{"field":"product","order":"asc"}]' }],
      [
        'a startDate after the endDate',
        {
          startDate: '2026-10-31T00:00:00.000Z',
          endDate: '2026-10-01T00:00:00.000Z',
        },
      ],
    ])('should reject %s', async (_, query) => {
      await expect(controller.findMovements(query)).rejects.toThrow(
        BadRequestException,
      );
      expect(listStockMovementsUseCase.execute).not.toHaveBeenCalled();
    });
  });

  describe('createMovement', () => {
    it('should call CreateStockMovementUseCase with the authenticated user and return the result', async () => {
      const dto: CreateStockMovementRequestDto = {
        productId,
        movementType: StockMovementType.IN,
        quantity: 10,
        description: 'Entrada de 10 litros de óleo 5W30',
      };

      const expectedResult = {
        id: 'movement-uuid',
        productId,
        movementType: StockMovementType.IN,
        quantity: 10,
        previousQuantity: 50,
        description: 'Entrada de 10 litros de óleo 5W30',
        referenceType: null,
        referenceId: null,
        createdBy: userId,
        createdAt: new Date(),
        stock: {
          id: 'stock-uuid',
          quantity: 60,
          reserved: 0,
          available: 60,
          updatedAt: new Date(),
        },
      };

      createStockMovementUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.createMovement(request, dto, currentUser);

      expect(createStockMovementUseCase.execute).toHaveBeenCalledWith({
        ...dto,
        createdBy: userId,
        createdByUsername: 'quiteria.dantas',
      });
      expect(result).toEqual(expectedResult);
    });

    it('should propagate ProductNotFoundError', async () => {
      createStockMovementUseCase.execute.mockRejectedValue(
        new ProductNotFoundError(productId),
      );

      await expect(
        controller.createMovement(request, {
          productId,
          movementType: StockMovementType.IN,
          quantity: 1,
        }, currentUser),
      ).rejects.toThrow(ProductNotFoundError);
    });

    it('should propagate InsufficientStockError', async () => {
      createStockMovementUseCase.execute.mockRejectedValue(
        new InsufficientStockError(productId, 10, 15),
      );

      await expect(
        controller.createMovement(request, {
          productId,
          movementType: StockMovementType.OUT,
          quantity: 15,
        }, currentUser),
      ).rejects.toThrow(InsufficientStockError);
    });
  });
});
