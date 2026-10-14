import { ExecutionContext, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { PermissionsController } from '@/infrastructure/http/permissions/permissions.controller';
import { ListRolesUseCase } from '@/application/use-cases/permissions/list-roles.use-case';
import { ChangeRoleUseCase } from '@/application/use-cases/permissions/change-role.use-case';
import { JwtAuthGuard } from '@/infrastructure/http/auth/jwt-auth.guard';
import { RolesGuard } from '@/infrastructure/http/auth/roles.guard';

describe('Permissions HTTP validation', () => {
  let app: INestApplication;
  const listRoles = { execute: jest.fn() };
  const changeRole = { execute: jest.fn() };
  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [PermissionsController],
      providers: [
        { provide: ListRolesUseCase, useValue: listRoles },
        { provide: ChangeRoleUseCase, useValue: changeRole },
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

  it('PATCH /permissions/users/:userId/role rejects a non-UUID userId with 400 before invoking the use case (regression USR-2)', async () => {
    await request(app.getHttpServer())
      .patch('/permissions/users/abc/role')
      .send({ role: 'admin' })
      .expect(400);

    expect(changeRole.execute).not.toHaveBeenCalled();
  });

  it('PATCH /permissions/users/:userId/role accepts a valid UUID', async () => {
    changeRole.execute.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .patch(`/permissions/users/${userId}/role`)
      .send({ role: 'admin' })
      .expect(204);

    expect(changeRole.execute).toHaveBeenCalledWith(userId, 'admin');
  });
});
