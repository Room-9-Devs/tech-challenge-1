import { describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from '@/infrastructure/http/controllers/products.controller';
import { CreateProductUseCase } from '@/application/use-cases/products/create-product/create-product.use-case';
import { ListProductsUseCase } from '@/application/use-cases/products/list-products/list-products.use-case';
import { FindProductUseCase } from '@/application/use-cases/products/find-product/find-product.use-case';
import { UpdateProductUseCase } from '@/application/use-cases/products/update-product/update-product.use-case';
import { DeleteProductUseCase } from '@/application/use-cases/products/delete-product/delete-product.use-case';
import { CreateProductRequestDto } from '@/infrastructure/http/dtos/create-product-request.dto';
import { UpdateProductRequestDto } from '@/infrastructure/http/dtos/update-product-request.dto';
import { ProductType, ProductUnit } from '@/domain/entities/product.entity';
import { ProductNotFoundError } from '@/domain/errors/product-not-found.error';
import { ProductHasStockError } from '@/domain/errors/product-has-stock.error';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { JwtAuthGuard } from '@/infrastructure/http/auth/jwt-auth.guard';
import { RolesGuard } from '@/infrastructure/http/auth/roles.guard';
import { ROLES_KEY } from '@/infrastructure/http/auth/roles.decorator';
import { CurrentUserInterceptor } from '@/infrastructure/http/auth/current-user.interceptor';
import { FindCurrentUserUseCase } from '@/application/use-cases/users/find-current-user/find-current-user.use-case';
import { CurrentUser } from '@/infrastructure/http/auth/current-user.type';

describe('ProductsController', () => {
  let controller: ProductsController;
  let createProductUseCase: jest.Mocked<CreateProductUseCase>;
  let listProductsUseCase: jest.Mocked<ListProductsUseCase>;
  let findProductUseCase: jest.Mocked<FindProductUseCase>;
  let updateProductUseCase: jest.Mocked<UpdateProductUseCase>;
  let deleteProductUseCase: jest.Mocked<DeleteProductUseCase>;

  const currentUser: CurrentUser = {
    id: 'user-1',
    username: 'staff',
    role: 'staff',
    entityType: 'employee',
  };

  const productData = {
    sku: 'OLEO-5W30-1L',
    name: 'Óleo 5W30 sintético',
    description: 'Óleo lubrificante sintético',
    productType: ProductType.CONSUMABLE,
    unit: ProductUnit.LITER,
    cost: 35.9,
    salePrice: 59.9,
  };

  beforeEach(async () => {
    const mockCreateProductUseCase = { execute: jest.fn() };
    const mockListProductsUseCase = { execute: jest.fn() };
    const mockFindProductUseCase = { execute: jest.fn() };
    const mockUpdateProductUseCase = { execute: jest.fn() };
    const mockDeleteProductUseCase = { execute: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: CreateProductUseCase,
          useValue: mockCreateProductUseCase,
        },
        {
          provide: ListProductsUseCase,
          useValue: mockListProductsUseCase,
        },
        {
          provide: FindProductUseCase,
          useValue: mockFindProductUseCase,
        },
        {
          provide: UpdateProductUseCase,
          useValue: mockUpdateProductUseCase,
        },
        {
          provide: DeleteProductUseCase,
          useValue: mockDeleteProductUseCase,
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

    controller = module.get<ProductsController>(ProductsController);
    createProductUseCase = module.get(CreateProductUseCase);
    listProductsUseCase = module.get(ListProductsUseCase);
    findProductUseCase = module.get(FindProductUseCase);
    updateProductUseCase = module.get(UpdateProductUseCase);
    deleteProductUseCase = module.get(DeleteProductUseCase);
  });

  describe('authorization', () => {
    it('should require authentication and admin or staff role', () => {
      expect(Reflect.getMetadata(GUARDS_METADATA, ProductsController)).toEqual([
        JwtAuthGuard,
        RolesGuard,
      ]);
      expect(Reflect.getMetadata(ROLES_KEY, ProductsController)).toEqual([
        'admin',
        'staff',
      ]);
    });
  });

  describe('create', () => {
    it('should call CreateProductUseCase and return the result', async () => {
      const dto: CreateProductRequestDto = { ...productData };

      const expectedResult = {
        id: 'uuid',
        ...productData,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      createProductUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.create(dto, currentUser);

      expect(createProductUseCase.execute).toHaveBeenCalledWith({ ...dto, createdBy: currentUser.username });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should call ListProductsUseCase with query and return the result', async () => {
      const expectedResult = {
        data: [
          {
            id: 'uuid-1',
            ...productData,
            active: true,
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

      listProductsUseCase.execute.mockResolvedValue(expectedResult);

      const query = {
        page: 1,
        limit: 10,
        search: undefined,
        sort: '[{"field":"createdAt","order":"desc"}]',
        filters: '{"productType":"PART"}',
      };

      const result = await controller.findAll(query);

      expect(listProductsUseCase.execute).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: undefined,
        sort: [{ field: 'createdAt', order: 'desc' }],
        filters: { productType: 'PART' },
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findById', () => {
    it('should call FindProductUseCase and return the result', async () => {
      const id = 'uuid';

      const expectedResult = {
        id,
        ...productData,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      findProductUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.findById(id);

      expect(findProductUseCase.execute).toHaveBeenCalledWith({ id });
      expect(result).toEqual(expectedResult);
    });

    it('should propagate ProductNotFoundError', async () => {
      findProductUseCase.execute.mockRejectedValue(
        new ProductNotFoundError('uuid'),
      );

      await expect(controller.findById('uuid')).rejects.toThrow(
        ProductNotFoundError,
      );
    });
  });

  describe('update', () => {
    it('should call UpdateProductUseCase and return the result', async () => {
      const id = 'uuid';
      const dto: UpdateProductRequestDto = { ...productData, salePrice: 69.9 };

      const expectedResult = {
        id,
        ...productData,
        salePrice: 69.9,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      updateProductUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.update(id, dto, currentUser);

      expect(updateProductUseCase.execute).toHaveBeenCalledWith({ id, ...dto, createdBy: currentUser.username });
      expect(result).toEqual(expectedResult);
    });

    it('should propagate ProductNotFoundError', async () => {
      updateProductUseCase.execute.mockRejectedValue(
        new ProductNotFoundError('uuid'),
      );

      await expect(
        controller.update('uuid', { ...productData }, currentUser),
      ).rejects.toThrow(ProductNotFoundError);
    });
  });

  describe('delete', () => {
    it('should call DeleteProductUseCase', async () => {
      const id = 'uuid';

      deleteProductUseCase.execute.mockResolvedValue(undefined);

      await controller.delete(id);

      expect(deleteProductUseCase.execute).toHaveBeenCalledWith({ id });
    });

    it('should propagate ProductHasStockError', async () => {
      deleteProductUseCase.execute.mockRejectedValue(
        new ProductHasStockError('uuid'),
      );

      await expect(controller.delete('uuid')).rejects.toThrow(
        ProductHasStockError,
      );
    });
  });
});
