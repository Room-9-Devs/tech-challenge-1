import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { UsersController } from '@/infrastructure/http/controllers/users.controller';
import { CreateUserUseCase } from '@/application/use-cases/users/create-user/create-user.use-case';
import { FindUserUseCase } from '@/application/use-cases/users/find-user/find-user.use-case';
import { ListUsersUseCase } from '@/application/use-cases/users/list-users/list-users.use-case';
import { FindCurrentUserUseCase } from '@/application/use-cases/users/find-current-user/find-current-user.use-case';
import { CurrentUserInterceptor } from '@/infrastructure/http/auth/current-user.interceptor';
import { JwtAuthGuard } from '@/infrastructure/http/auth/jwt-auth.guard';
import { RolesGuard } from '@/infrastructure/http/auth/roles.guard';

describe('Users HTTP validation', () => {
  let app: INestApplication;
  const create = { execute: jest.fn() };
  const find = { execute: jest.fn() };
  const list = { execute: jest.fn() };
  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: CreateUserUseCase, useValue: create },
        { provide: FindUserUseCase, useValue: find },
        { provide: ListUsersUseCase, useValue: list },
        {
          provide: FindCurrentUserUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue({
              id: 'user-1',
              username: 'admin',
              role: 'admin',
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
            role: 'admin',
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

  it('GET /users/:id rejects a non-UUID id with 400 before invoking the use case (regression USR-2)', async () => {
    await request(app.getHttpServer()).get('/users/abc').expect(400);

    expect(find.execute).not.toHaveBeenCalled();
  });

  it('GET /users/:id accepts a valid UUID', async () => {
    find.execute.mockResolvedValue({ id: userId });

    await request(app.getHttpServer()).get(`/users/${userId}`).expect(200);

    expect(find.execute).toHaveBeenCalledWith({ id: userId });
  });
});
