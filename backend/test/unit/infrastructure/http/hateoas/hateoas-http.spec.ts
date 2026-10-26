import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { RepairsController } from '@/infrastructure/http/controllers/repairs.controller';
import { CreateRepairUseCase } from '@/application/use-cases/repairs/create-repair/create-repair.use-case';
import { FindRepairUseCase } from '@/application/use-cases/repairs/find-repair/find-repair.use-case';
import { ListRepairsUseCase } from '@/application/use-cases/repairs/list-repairs/list-repairs.use-case';
import { UpdateRepairUseCase } from '@/application/use-cases/repairs/update-repair/update-repair.use-case';
import { DeleteRepairUseCase } from '@/application/use-cases/repairs/delete-repair/delete-repair.use-case';
import { FindCurrentUserUseCase } from '@/application/use-cases/users/find-current-user/find-current-user.use-case';
import { JwtAuthGuard } from '@/infrastructure/http/auth/jwt-auth.guard';
import { RolesGuard } from '@/infrastructure/http/auth/roles.guard';

describe('HATEOAS over HTTP (RepairsController)', () => {
  let app: INestApplication;
  let role = 'admin';

  const repair = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Troca de óleo',
    unitValue: 120,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [RepairsController],
      providers: [
        { provide: CreateRepairUseCase, useValue: { execute: jest.fn() } },
        {
          provide: FindRepairUseCase,
          useValue: { execute: jest.fn().mockResolvedValue(repair) },
        },
        {
          provide: ListRepairsUseCase,
          useValue: {
            execute: jest.fn().mockResolvedValue({
              data: [repair],
              meta: { page: 1, limit: 1, totalItems: 2, totalPages: 2 },
            }),
          },
        },
        { provide: UpdateRepairUseCase, useValue: { execute: jest.fn() } },
        { provide: DeleteRepairUseCase, useValue: { execute: jest.fn() } },
        { provide: FindCurrentUserUseCase, useValue: { execute: jest.fn() } },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (ctx) => {
          ctx.switchToHttp().getRequest().user = { sub: 'u1', role };
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns item links according to the user role', async () => {
    role = 'admin';
    const admin = await request(app.getHttpServer()).get(
      '/repairs/550e8400-e29b-41d4-a716-446655440001',
    );
    expect(admin.status).toBe(200);
    expect(admin.body._links).toEqual({
      self: { href: '/repairs/550e8400-e29b-41d4-a716-446655440001', method: 'GET' },
      update: { href: '/repairs/550e8400-e29b-41d4-a716-446655440001', method: 'PUT' },
      delete: { href: '/repairs/550e8400-e29b-41d4-a716-446655440001', method: 'DELETE' },
      events: { href: '/events/repair/550e8400-e29b-41d4-a716-446655440001', method: 'GET' },
    });

    role = 'client';
    const client = await request(app.getHttpServer()).get(
      '/repairs/550e8400-e29b-41d4-a716-446655440001',
    );
    expect(client.body._links).toEqual({
      self: { href: '/repairs/550e8400-e29b-41d4-a716-446655440001', method: 'GET' },
      events: { href: '/events/repair/550e8400-e29b-41d4-a716-446655440001', method: 'GET' },
    });
  });

  it('returns pagination links on the collection', async () => {
    role = 'admin';
    const response = await request(app.getHttpServer())
      .get('/repairs')
      .query({ page: 1, limit: 1, search: 'óleo' });

    expect(response.status).toBe(200);
    expect(response.body.data[0]._links.self.href).toBe(
      '/repairs/550e8400-e29b-41d4-a716-446655440001',
    );
    expect(response.body._links.next.href).toBe(
      '/repairs?search=%C3%B3leo&page=2&limit=1',
    );
    expect(response.body._links.prev).toBeUndefined();
    expect(response.body._links.create.method).toBe('POST');
  });
});
