import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request = require('supertest');
import { VehiclesController } from '@/infrastructure/http/controllers/vehicles.controller';
import { CreateVehicleUseCase } from '@/application/use-cases/vehicles/create-vehicle/create-vehicle.use-case';
import { FindVehicleUseCase } from '@/application/use-cases/vehicles/find-vehicle/find-vehicle.use-case';
import { ListVehiclesUseCase } from '@/application/use-cases/vehicles/list-vehicles/list-vehicles.use-case';
import { UpdateVehicleUseCase } from '@/application/use-cases/vehicles/update-vehicle.use-case';
import { DeleteVehicleUseCase } from '@/application/use-cases/vehicles/delete-vehicle.use-case';
import { GetFipeDataUseCase } from '@/application/use-cases/vehicles/get-fipe-data.use-case';
import { TOKEN_SERVICE } from '@/application/ports/token-service.port';
import { CurrentUserInterceptor } from '@/infrastructure/http/auth/current-user.interceptor';
import { FindCurrentUserUseCase } from '@/application/use-cases/users/find-current-user/find-current-user.use-case';
import { CurrentUser } from '@/application/use-cases/users/current-user.dto';

describe('Vehicle HTTP validation', () => {
  let app: INestApplication;
  const find = { execute: jest.fn() };
  const update = { execute: jest.fn() };
  const remove = { execute: jest.fn() };
  const currentUser: CurrentUser = {
    id: 'user-1',
    username: 'admin',
    role: 'admin',
    entityType: 'employee',
  };
  const details = {
    license_plate: 'ABC1D23',
    model: 'Civic',
    brand: 'Honda',
    year: 2023,
    color: 'White',
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [
        { provide: CreateVehicleUseCase, useValue: { execute: jest.fn() } },
        { provide: FindVehicleUseCase, useValue: find },
        { provide: ListVehiclesUseCase, useValue: { execute: jest.fn() } },
        { provide: UpdateVehicleUseCase, useValue: update },
        { provide: DeleteVehicleUseCase, useValue: remove },
        { provide: GetFipeDataUseCase, useValue: { execute: jest.fn() } },
        {
          provide: TOKEN_SERVICE,
          useValue: { verify: jest.fn().mockReturnValue({ sub: 'user-id', role: 'admin' }) },
        },
        {
          provide: FindCurrentUserUseCase,
          useValue: { execute: jest.fn().mockResolvedValue(currentUser) },
        },
        CurrentUserInterceptor,
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(() => jest.clearAllMocks());

  const authHeader = { Authorization: 'Bearer valid-token' };

  it.each(['get', 'put', 'delete', 'post'] as const)(
    'rejects malformed UUID on %s before invoking the use case',
    async (method) => {
      const call = request(app.getHttpServer())
        [method]('/vehicles/not-a-uuid')
        .set(authHeader);
      if (method === 'put' || method === 'post') call.send(details);
      await call.expect(400);
      expect(find.execute).not.toHaveBeenCalled();
      expect(update.execute).not.toHaveBeenCalled();
      expect(remove.execute).not.toHaveBeenCalled();
    },
  );

  it('accepts a valid UUID', async () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    find.execute.mockResolvedValue({ id });
    await request(app.getHttpServer())
      .get(`/vehicles/${id}`)
      .set(authHeader)
      .expect(200);
    expect(find.execute).toHaveBeenCalledWith({ id });
  });

  it('rejects an owner change through the replacement DTO', async () => {
    await request(app.getHttpServer())
      .put('/vehicles/550e8400-e29b-41d4-a716-446655440000')
      .set(authHeader)
      .send({ ...details, user_id: '550e8400-e29b-41d4-a716-446655440001' })
      .expect(400);
    expect(update.execute).not.toHaveBeenCalled();
  });
});
