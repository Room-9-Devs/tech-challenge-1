import { ExecutionContext, INestApplication } from '@nestjs/common';
import { AppValidationPipe } from '@/infrastructure/http/pipes/app-validation.pipe';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { StockController } from '@/infrastructure/http/controllers/stock.controller';
import { ListStockUseCase } from '@/application/use-cases/stock/list-stock/list-stock.use-case';
import { CreateStockMovementUseCase } from '@/application/use-cases/stock/create-stock-movement/create-stock-movement.use-case';
import { ListStockMovementsUseCase } from '@/application/use-cases/stock/list-stock-movements/list-stock-movements.use-case';
import { JwtAuthGuard } from '@/infrastructure/http/auth/jwt-auth.guard';
import { RolesGuard } from '@/infrastructure/http/auth/roles.guard';
import { CurrentUserInterceptor } from '@/infrastructure/http/auth/current-user.interceptor';
import { FindCurrentUserUseCase } from '@/application/use-cases/users/find-current-user/find-current-user.use-case';

describe('Stock HTTP validation', () => {
  let app: INestApplication;
  const create = { execute: jest.fn() };
  const list = { execute: jest.fn() };
  const userId = '660e8400-e29b-41d4-a716-446655440000';
  const movement = {
    productId: '550e8400-e29b-41d4-a716-446655440000',
    movementType: 'IN',
    quantity: 10,
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [StockController],
      providers: [
        { provide: ListStockUseCase, useValue: { execute: jest.fn() } },
        { provide: CreateStockMovementUseCase, useValue: create },
        { provide: ListStockMovementsUseCase, useValue: list },
        {
          provide: FindCurrentUserUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue({
              id: userId,
              username: 'quiteria.dantas',
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
            sub: userId,
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

  it('accepts a valid movement and uses the authenticated user as creator', async () => {
    create.execute.mockResolvedValue({ id: 'movement-uuid' });

    await request(app.getHttpServer())
      .post('/stock/movements')
      .send(movement)
      .expect(201);

    expect(create.execute).toHaveBeenCalledWith({
      ...movement,
      createdBy: userId,
      createdByUsername: 'quiteria.dantas',
    });
  });

  it('accepts a description with 500 characters', async () => {
    create.execute.mockResolvedValue({ id: 'movement-uuid' });

    await request(app.getHttpServer())
      .post('/stock/movements')
      .send({ ...movement, description: 'A'.repeat(500) })
      .expect(201);
  });

  it.each([
    ['string quantity', { quantity: '10' }],
    ['decimal quantity', { quantity: 1.5 }],
    ['negative quantity', { quantity: -1 }],
    ['quantity above the integer limit', { quantity: 2147483648 }],
    ['missing quantity', { quantity: undefined }],
    ['unknown movement type', { movementType: 'TRANSFER' }],
    ['malformed product id', { productId: 'not-a-uuid' }],
    ['malformed reference id', { referenceId: 'not-a-uuid' }],
    ['reference type longer than 50 characters', { referenceType: 'A'.repeat(51) }],
    ['description longer than 500 characters', { description: 'A'.repeat(501) }],
    ['creator sent in the body', { createdBy: userId }],
  ])('rejects %s before invoking the use case', async (_, override) => {
    await request(app.getHttpServer())
      .post('/stock/movements')
      .send({ ...movement, ...override })
      .expect(400);

    expect(create.execute).not.toHaveBeenCalled();
  });

  it('accepts a period on the movements history', async () => {
    list.execute.mockResolvedValue({ data: [], meta: {} });

    await request(app.getHttpServer())
      .get('/stock/movements')
      .query({
        startDate: '2026-10-01T00:00:00.000Z',
        endDate: '2026-10-31T23:59:59.999Z',
      })
      .expect(200);

    expect(list.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        startDate: new Date('2026-10-01T00:00:00.000Z'),
        endDate: new Date('2026-10-31T23:59:59.999Z'),
      }),
    );
  });

  it('rejects a malformed date on the movements history', async () => {
    await request(app.getHttpServer())
      .get('/stock/movements')
      .query({ startDate: 'ontem' })
      .expect(400);

    expect(list.execute).not.toHaveBeenCalled();
  });
});
