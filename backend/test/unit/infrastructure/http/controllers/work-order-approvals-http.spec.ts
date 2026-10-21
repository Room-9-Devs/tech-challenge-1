import { INestApplication } from '@nestjs/common';
import { AppValidationPipe } from '@/infrastructure/http/pipes/app-validation.pipe';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { REFRESH_TOKEN_SERVICE } from '@/application/ports/refresh-token-service.port';
import { WORK_ORDER_APPROVAL_TOKEN_REPOSITORY } from '@/application/ports/work-order-approval-token.repository';
import { WorkOrderQuoteService } from '@/application/services/work-order-quote.service';
import { USER_REPOSITORY } from '@/application/use-cases/users/create-user/create-user.use-case';
import { DecideWorkOrderApprovalUseCase } from '@/application/use-cases/work-order-approvals/decide-work-order-approval/decide-work-order-approval.use-case';
import { GetWorkOrderApprovalUseCase } from '@/application/use-cases/work-order-approvals/get-work-order-approval/get-work-order-approval.use-case';
import { IssueWorkOrderApprovalTokenUseCase } from '@/application/use-cases/work-order-approvals/issue-work-order-approval-token/issue-work-order-approval-token.use-case';
import { ChangeWorkOrderStatusUseCase } from '@/application/use-cases/work-orders/change-work-order-status/change-work-order-status.use-case';
import { EventType } from '@/domain/entities/event-type.entity';
import { WorkOrder } from '@/domain/entities/work-order.entity';
import { WorkOrderItem } from '@/domain/entities/work-order-item.entity';
import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import { WORK_ORDER_REPOSITORY } from '@/domain/repositories/work-order.repository';
import { WorkOrderApprovalsController } from '@/infrastructure/http/controllers/work-order-approvals.controller';
import { DomainExceptionFilter } from '@/infrastructure/http/filters/domain-exception.filter';
import { OpaqueRefreshTokenService } from '@/infrastructure/services/jwt/opaque-refresh-token.service';
import { FakeWorkOrderApprovalTokenRepository } from '../../../../fakes/fake-work-order-approval-token.repository';

// Fluxo completo pela HTTP: e-mail gera o token, GET mostra a página, o formulário faz o POST.
describe('Work order approval over HTTP', () => {
  let app: INestApplication;
  let order: WorkOrder;
  let approvalTokens: FakeWorkOrderApprovalTokenRepository;
  let publishedEvents: any[];

  beforeEach(async () => {
    order = WorkOrder.reconstitute({
      id: 'order-id',
      number: 'OS-0042/2026',
      status: WorkOrderStatus.AWAITING_APPROVAL,
      vehicleId: 'vehicle-id',
      clientId: 'client-id',
      createdBy: 'staff-id',
      items: [
        WorkOrderItem.reconstitute({
          quantity: 1,
          unitPrice: 150,
          serviceId: 'repair-id',
        }),
      ],
    });
    approvalTokens = new FakeWorkOrderApprovalTokenRepository();
    publishedEvents = [];
    const workOrders = {
      findById: jest.fn(async () => order),
      save: jest.fn(async (saved: WorkOrder) => (order = saved)),
    };
    const users = {
      findById: jest.fn().mockResolvedValue({
        id: 'client-id',
        username: 'maria.silva',
        email: 'maria@cliente.com',
        entityId: 'profile-id',
      }),
    };
    const repositories = {
      workOrders,
      events: {
        findByEntity: jest.fn().mockResolvedValue([]),
        save: jest.fn(),
      },
      eventTypes: {
        findByCode: jest.fn(async (code: string) =>
          EventType.create({
            code,
            name: code,
            allowedEntityTypes: ['work_order'],
          }),
        ),
      },
      stocks: { findByProductId: jest.fn(), save: jest.fn() },
      stockMovements: { save: jest.fn() },
      approvalTokens,
    };
    const quotes = new WorkOrderQuoteService(
      users as any,
      { findById: jest.fn().mockResolvedValue({ name: 'Maria Silva' }) } as any,
      {
        findById: jest.fn().mockResolvedValue({
          brand: 'Fiat',
          model: 'Uno',
          license_plate: 'ABC1D23',
        }),
      } as any,
      {
        findById: jest.fn().mockResolvedValue({ description: 'Alinhamento' }),
      } as any,
      { findByIdIncludingInactive: jest.fn() } as any,
    );

    const moduleRef = await Test.createTestingModule({
      controllers: [WorkOrderApprovalsController],
      providers: [
        GetWorkOrderApprovalUseCase,
        DecideWorkOrderApprovalUseCase,
        { provide: WorkOrderQuoteService, useValue: quotes },
        {
          provide: WORK_ORDER_APPROVAL_TOKEN_REPOSITORY,
          useValue: approvalTokens,
        },
        { provide: REFRESH_TOKEN_SERVICE, useClass: OpaqueRefreshTokenService },
        { provide: WORK_ORDER_REPOSITORY, useValue: workOrders },
        { provide: USER_REPOSITORY, useValue: users },
        {
          provide: ChangeWorkOrderStatusUseCase,
          useFactory: () =>
            new ChangeWorkOrderStatusUseCase(
              workOrders as any,
              { run: (work: any) => work(repositories) },
              {
                publish: async (event: any) => {
                  publishedEvents.push(event);
                },
              },
            ),
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    // Mesma configuração global do main.ts
    app.useGlobalPipes(
      new AppValidationPipe(),
    );
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  async function issueToken(): Promise<string> {
    return new IssueWorkOrderApprovalTokenUseCase(
      approvalTokens,
      new OpaqueRefreshTokenService(),
      72,
    ).execute(order);
  }

  it('shows the confirmation page with security headers and without changing the order', async () => {
    const token = await issueToken();

    const response = await request(app.getHttpServer())
      .get(`/work-order-approvals/${token}/approve`)
      .expect(200);

    expect(response.headers['content-type']).toContain('text/html');
    expect(response.headers['referrer-policy']).toBe('no-referrer');
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers['content-security-policy']).toContain(
      "form-action 'self'",
    );
    expect(response.headers['content-security-policy']).toContain(
      'img-src data:',
    );
    expect(response.text).toContain('CONFIRMAR APROVAÇÃO');
    expect(response.text).toContain('Fiat Uno - ABC1D23');
    expect(order.status).toBe(WorkOrderStatus.AWAITING_APPROVAL);
  });

  it('approves through the html form post and invalidates the link', async () => {
    const token = await issueToken();
    const server = app.getHttpServer();

    const response = await request(server)
      .post(`/work-order-approvals/${token}/approve`)
      .type('form')
      .send('')
      .expect(200);

    expect(response.text).toContain('Orçamento aprovado');
    expect(order.status).toBe(WorkOrderStatus.APPROVED);
    expect(approvalTokens.records[0].usedAt).toBeInstanceOf(Date);
    expect(publishedEvents[0]).toMatchObject({
      createdBy: 'maria.silva',
      metadata: {
        from: WorkOrderStatus.AWAITING_APPROVAL,
        to: WorkOrderStatus.APPROVED,
      },
    });

    const again = await request(server)
      .get(`/work-order-approvals/${token}/reject`)
      .expect(404);
    expect(again.headers['content-type']).toContain('text/html');
    expect(again.text).toContain('Link inválido ou expirado');
  });

  it('rejects with the reason typed in the form', async () => {
    const token = await issueToken();

    await request(app.getHttpServer())
      .post(`/work-order-approvals/${token}/reject`)
      .type('form')
      .send({ reason: 'Muito caro' })
      .expect(200);

    expect(order.status).toBe(WorkOrderStatus.CANCELLED);
    expect(publishedEvents[0].note).toBe(
      'Orçamento recusado pelo cliente via link do e-mail: Muito caro',
    );
  });

  it('answers with an html error page when the form has unexpected fields', async () => {
    const token = await issueToken();

    const response = await request(app.getHttpServer())
      .post(`/work-order-approvals/${token}/approve`)
      .type('form')
      .send({ status: 'delivered' })
      .expect(400);

    expect(response.headers['content-type']).toContain('text/html');
    expect(response.text).toContain('Não foi possível registrar');
    expect(order.status).toBe(WorkOrderStatus.AWAITING_APPROVAL);
  });

  it('answers with the invalid link page for unknown tokens', async () => {
    const response = await request(app.getHttpServer())
      .get(`/work-order-approvals/${'x'.repeat(64)}/approve`)
      .expect(404);

    expect(response.text).toContain('Link inválido ou expirado');
  });
});
