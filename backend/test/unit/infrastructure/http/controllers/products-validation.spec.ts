import { ExecutionContext, INestApplication } from '@nestjs/common';
import { AppValidationPipe } from '@/infrastructure/http/pipes/app-validation.pipe';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { ProductsController } from '@/infrastructure/http/controllers/products.controller';
import { CreateProductUseCase } from '@/application/use-cases/products/create-product/create-product.use-case';
import { ListProductsUseCase } from '@/application/use-cases/products/list-products/list-products.use-case';
import { FindProductUseCase } from '@/application/use-cases/products/find-product/find-product.use-case';
import { UpdateProductUseCase } from '@/application/use-cases/products/update-product/update-product.use-case';
import { DeleteProductUseCase } from '@/application/use-cases/products/delete-product/delete-product.use-case';
import { ActivateProductUseCase } from '@/application/use-cases/products/activate-product/activate-product.use-case';
import { FindCurrentUserUseCase } from '@/application/use-cases/users/find-current-user/find-current-user.use-case';
import { CurrentUserInterceptor } from '@/infrastructure/http/auth/current-user.interceptor';
import { JwtAuthGuard } from '@/infrastructure/http/auth/jwt-auth.guard';
import { RolesGuard } from '@/infrastructure/http/auth/roles.guard';

describe('Products HTTP validation', () => {
  let app: INestApplication;
  const create = { execute: jest.fn() };
  const list = { execute: jest.fn() };
  const find = { execute: jest.fn() };
  const update = { execute: jest.fn() };
  const remove = { execute: jest.fn() };
  const activate = { execute: jest.fn() };
  const productId = '550e8400-e29b-41d4-a716-446655440000';
  const product = {
    sku: 'OLEO-5W30-1L',
    name: 'Óleo 5W30 sintético',
    productType: 'CONSUMABLE',
    unit: 'LITER',
    cost: 35.9,
    salePrice: 59.9,
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        { provide: CreateProductUseCase, useValue: create },
        { provide: ListProductsUseCase, useValue: list },
        { provide: FindProductUseCase, useValue: find },
        { provide: UpdateProductUseCase, useValue: update },
        { provide: DeleteProductUseCase, useValue: remove },
        { provide: ActivateProductUseCase, useValue: activate },
        {
          provide: FindCurrentUserUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue({
              id: 'user-1',
              username: 'staff',
              role: 'staff',
              entityType: 'employee',
            }),
          },
        },
        CurrentUserInterceptor,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          context.switchToHttp().getRequest().user = {
            sub: 'user-1',
            role: 'staff',
            entityType: 'employee',
          };
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new AppValidationPipe(),
    );
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => jest.clearAllMocks());

  describe('route id', () => {
    it.each([
      ['GET', '/products/abc'],
      ['PUT', '/products/abc'],
      ['DELETE', '/products/abc'],
      ['PATCH', '/products/abc/activate'],
    ])('%s %s rejects a non-UUID id with 400', async (method, path) => {
      const call = request(app.getHttpServer())[
        method.toLowerCase() as 'get' | 'put' | 'delete' | 'patch'
      ](path);

      await (method === 'PUT' ? call.send(product) : call).expect(400);

      expect(find.execute).not.toHaveBeenCalled();
      expect(update.execute).not.toHaveBeenCalled();
      expect(remove.execute).not.toHaveBeenCalled();
      expect(activate.execute).not.toHaveBeenCalled();
    });

    it('accepts a valid UUID', async () => {
      find.execute.mockResolvedValue({ id: productId });

      await request(app.getHttpServer()).get(`/products/${productId}`).expect(200);

      expect(find.execute).toHaveBeenCalledWith({ id: productId });
    });

    it('reactivates a product with a valid UUID', async () => {
      activate.execute.mockResolvedValue({ id: productId, active: true });

      await request(app.getHttpServer())
        .patch(`/products/${productId}/activate`)
        .expect(200);

      expect(activate.execute).toHaveBeenCalledWith({ id: productId });
    });
  });

  describe('prices', () => {
    it.each([
      ['cost above numeric(10,2)', { cost: 100000000 }],
      ['salePrice above numeric(10,2)', { salePrice: 100000000 }],
      ['cost with 3 decimal places', { cost: 10.555 }],
      ['salePrice with 3 decimal places', { salePrice: 59.999 }],
      ['negative cost', { cost: -1 }],
    ])('POST rejects %s with 400', async (_case, change) => {
      await request(app.getHttpServer())
        .post('/products')
        .send({ ...product, ...change })
        .expect(400);

      expect(create.execute).not.toHaveBeenCalled();
    });

    it('PUT rejects price above numeric(10,2) with 400', async () => {
      await request(app.getHttpServer())
        .put(`/products/${productId}`)
        .send({ ...product, salePrice: 100000000 })
        .expect(400);

      expect(update.execute).not.toHaveBeenCalled();
    });

    it('POST accepts the maximum value with 2 decimal places', async () => {
      create.execute.mockResolvedValue({ id: productId });

      await request(app.getHttpServer())
        .post('/products')
        .send({ ...product, cost: 99999999.99, salePrice: 0.01 })
        .expect(201);

      expect(create.execute).toHaveBeenCalled();
    });
  });

  describe('list filters', () => {
    it.each([
      ['unknown productType', { productType: 'FOO' }],
      ['unknown unit', { unit: 'GALLON' }],
      ['non-string unit', { unit: 1 }],
      ['non-string sku', { sku: true }],
    ])('rejects %s with 400', async (_case, filters) => {
      await request(app.getHttpServer())
        .get('/products')
        .query({ filters: JSON.stringify(filters) })
        .expect(400);

      expect(list.execute).not.toHaveBeenCalled();
    });

    it('accepts valid filters', async () => {
      list.execute.mockResolvedValue({ data: [], meta: {} });

      await request(app.getHttpServer())
        .get('/products')
        .query({ filters: JSON.stringify({ productType: 'PART', sku: 'true' }) })
        .expect(200);

      expect(list.execute).toHaveBeenCalledWith(
        expect.objectContaining({ filters: { productType: 'PART', sku: 'true' } }),
      );
    });
  });
});
