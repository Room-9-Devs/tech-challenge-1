import { ExecutionContext, INestApplication } from '@nestjs/common';
import { AppValidationPipe } from '@/infrastructure/http/pipes/app-validation.pipe';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { UsersController } from '@/infrastructure/http/controllers/users.controller';
import { CreateUserUseCase } from '@/application/use-cases/users/create-user/create-user.use-case';
import { FindUserUseCase } from '@/application/use-cases/users/find-user/find-user.use-case';
import { ListUsersUseCase } from '@/application/use-cases/users/list-users/list-users.use-case';
import { UpdateUserUseCase } from '@/application/use-cases/users/update-user/update-user.use-case';
import { DeleteUserUseCase } from '@/application/use-cases/users/delete-user/delete-user.use-case';
import { FindCurrentUserUseCase } from '@/application/use-cases/users/find-current-user/find-current-user.use-case';
import { CurrentUserInterceptor } from '@/infrastructure/http/auth/current-user.interceptor';
import { JwtAuthGuard } from '@/infrastructure/http/auth/jwt-auth.guard';
import { RolesGuard } from '@/infrastructure/http/auth/roles.guard';

describe('Users HTTP validation', () => {
  let app: INestApplication;
  const create = { execute: jest.fn() };
  const find = { execute: jest.fn() };
  const list = { execute: jest.fn() };
  const update = { execute: jest.fn() };
  const remove = { execute: jest.fn() };
  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: CreateUserUseCase, useValue: create },
        { provide: FindUserUseCase, useValue: find },
        { provide: ListUsersUseCase, useValue: list },
        { provide: UpdateUserUseCase, useValue: update },
        { provide: DeleteUserUseCase, useValue: remove },
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
      new AppValidationPipe(),
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

  it.each([
    ['a profile name longer than 150 characters', { name: 'A'.repeat(151) }, 'O campo profile.name deve ter no máximo 150 caracteres'],
    ['a non-string profile name', { name: 123 }, 'O campo profile.name deve ser um texto'],
    ['an empty profile name', { name: '' }, 'O campo profile.name não pode ser vazio'],
    ['a whitespace-only profile name', { name: '   ' }, 'O campo profile.name não pode ser vazio'],
    ['a null profile name', { name: null }, 'O campo profile.name deve ser um texto'],
    ['a null profile phone', { phone: null }, 'O campo profile.phone deve ser um texto'],
    ['an unknown profile field', { document: '529.982.247-25' }, 'O campo profile.document não é permitido'],
  ])('PATCH /users/:id rejects %s with 400 before invoking the use case', async (_case, profile, message) => {
    const response = await request(app.getHttpServer())
      .patch(`/users/${userId}`)
      .send({ profile })
      .expect(400);

    expect(response.body.message).toContain(message);
    expect(update.execute).not.toHaveBeenCalled();
  });

  it('PATCH /users/:id forwards a valid profile to the use case', async () => {
    update.execute.mockResolvedValue({ id: userId });
    const profile = { name: 'Agnaldo Guimarães', phone: '(11) 99999-9999' };

    await request(app.getHttpServer()).patch(`/users/${userId}`).send({ profile }).expect(200);

    expect(update.execute).toHaveBeenCalledWith(
      expect.objectContaining({ id: userId, profile: expect.objectContaining(profile) }),
    );
  });

  it('PATCH /users/:id trims the profile name before forwarding it', async () => {
    update.execute.mockResolvedValue({ id: userId });

    await request(app.getHttpServer())
      .patch(`/users/${userId}`)
      .send({ profile: { name: '  Agnaldo Guimarães  ' } })
      .expect(200);

    expect(update.execute).toHaveBeenCalledWith(
      expect.objectContaining({ profile: expect.objectContaining({ name: 'Agnaldo Guimarães' }) }),
    );
  });

  it('PATCH /users/:id still accepts a profile without a name', async () => {
    update.execute.mockResolvedValue({ id: userId });

    await request(app.getHttpServer())
      .patch(`/users/${userId}`)
      .send({ profile: { phone: '(11) 99999-9999' } })
      .expect(200);

    expect(update.execute).toHaveBeenCalled();
  });
});
