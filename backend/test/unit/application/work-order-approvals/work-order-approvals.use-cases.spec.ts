import { WorkOrder } from '@/domain/entities/work-order.entity';
import { WorkOrderItem } from '@/domain/entities/work-order-item.entity';
import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import { WorkOrderQuoteService } from '@/application/services/work-order-quote.service';
import { IssueWorkOrderApprovalTokenUseCase } from '@/application/use-cases/work-order-approvals/issue-work-order-approval-token/issue-work-order-approval-token.use-case';
import { GetWorkOrderApprovalUseCase } from '@/application/use-cases/work-order-approvals/get-work-order-approval/get-work-order-approval.use-case';
import { DecideWorkOrderApprovalUseCase } from '@/application/use-cases/work-order-approvals/decide-work-order-approval/decide-work-order-approval.use-case';
import { WorkOrderApprovalDecision } from '@/application/use-cases/work-order-approvals/work-order-approval-decision.enum';
import { WorkOrderApprovalLinkInvalidError } from '@/domain/errors/work-order-approval-link-invalid.error';
import { FakeWorkOrderApprovalTokenRepository } from '../../../fakes/fake-work-order-approval-token.repository';
import { FakeRefreshTokenService } from '../../../fakes/fake-token-services';

describe('Work order approval use cases', () => {
  let approvalTokens: FakeWorkOrderApprovalTokenRepository;
  let opaqueTokens: FakeRefreshTokenService;
  let orders: any;
  let users: any;
  let quotes: WorkOrderQuoteService;
  let changeWorkOrderStatus: any;
  let order: WorkOrder;
  let issue: IssueWorkOrderApprovalTokenUseCase;
  let get: GetWorkOrderApprovalUseCase;
  let decide: DecideWorkOrderApprovalUseCase;

  const makeOrder = (status: WorkOrderStatus, clientId = 'client-id') =>
    WorkOrder.reconstitute({
      id: 'order-id',
      number: 'OS-0042/2026',
      status,
      vehicleId: 'vehicle-id',
      clientId,
      createdBy: 'staff-id',
      items: [
        WorkOrderItem.reconstitute({
          quantity: 1,
          unitPrice: 150,
          serviceId: 'repair-id',
        }),
      ],
      updatedAt: new Date('2026-10-06T12:00:00Z'),
    });

  beforeEach(() => {
    approvalTokens = new FakeWorkOrderApprovalTokenRepository();
    opaqueTokens = new FakeRefreshTokenService();
    order = makeOrder(WorkOrderStatus.AWAITING_APPROVAL);
    orders = { findById: jest.fn(async () => order) };
    users = {
      findById: jest.fn().mockResolvedValue({
        id: 'client-id',
        username: 'maria.silva',
        email: 'maria@cliente.com',
        entityId: 'profile-id',
      }),
    };
    quotes = new WorkOrderQuoteService(
      users,
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
    changeWorkOrderStatus = { execute: jest.fn().mockResolvedValue(order) };
    issue = new IssueWorkOrderApprovalTokenUseCase(
      approvalTokens,
      opaqueTokens,
      72,
    );
    get = new GetWorkOrderApprovalUseCase(
      approvalTokens,
      opaqueTokens,
      orders,
      quotes,
    );
    decide = new DecideWorkOrderApprovalUseCase(
      approvalTokens,
      opaqueTokens,
      orders,
      users,
      changeWorkOrderStatus,
    );
  });

  describe('IssueWorkOrderApprovalTokenUseCase', () => {
    it('stores only the hash, bound to the order and its client, with the configured expiration', async () => {
      const before = Date.now();

      const token = await issue.execute(order);

      const [record] = approvalTokens.records;
      expect(record.tokenHash).toBe(opaqueTokens.hash(token));
      expect(record.tokenHash).not.toBe(token);
      expect(record.workOrderId).toBe('order-id');
      expect(record.clientId).toBe('client-id');
      expect(record.expiresAt.getTime()).toBeGreaterThanOrEqual(
        before + 72 * 60 * 60 * 1000,
      );
    });

    it('revokes the links sent before when the quote is sent again', async () => {
      await issue.execute(order);
      await issue.execute(order);

      const [first, second] = approvalTokens.records;
      expect(first.revokedAt).toBeInstanceOf(Date);
      expect(second.revokedAt).toBeNull();
    });
  });

  describe('GetWorkOrderApprovalUseCase', () => {
    it('returns the readable quote without exposing the client email', async () => {
      const token = await issue.execute(order);

      const quote = await get.execute(token);

      expect(quote).toEqual({
        customerName: 'Maria Silva',
        vehicle: 'Fiat Uno - ABC1D23',
        orderNumber: 'OS-0042/2026',
        items: [
          {
            description: 'Alinhamento',
            quantity: 1,
            unitPrice: 150,
            subtotal: 150,
          },
        ],
        total: 150,
        generatedAt: order.updatedAt,
      });
      expect(quote).not.toHaveProperty('email');
    });

    it('never changes the order status', async () => {
      const token = await issue.execute(order);

      await get.execute(token);

      expect(changeWorkOrderStatus.execute).not.toHaveBeenCalled();
      expect(approvalTokens.records[0].usedAt).toBeNull();
    });

    it.each([
      ['unknown', async () => 'unknown-token'],
      [
        'expired',
        async () => {
          const token = await issue.execute(order);
          approvalTokens.records[0].expiresAt = new Date(Date.now() - 1000);
          return token;
        },
      ],
      [
        'revoked',
        async () => {
          const token = await issue.execute(order);
          approvalTokens.records[0].revokedAt = new Date();
          return token;
        },
      ],
      [
        'already used',
        async () => {
          const token = await issue.execute(order);
          approvalTokens.records[0].usedAt = new Date();
          return token;
        },
      ],
      ['empty', async () => ''],
    ])('rejects an %s token', async (_label, prepare) => {
      const token = await prepare();

      await expect(get.execute(token)).rejects.toBeInstanceOf(
        WorkOrderApprovalLinkInvalidError,
      );
    });

    it('rejects the link when the order is no longer awaiting approval', async () => {
      const token = await issue.execute(order);
      order = makeOrder(WorkOrderStatus.APPROVED);

      await expect(get.execute(token)).rejects.toBeInstanceOf(
        WorkOrderApprovalLinkInvalidError,
      );
    });

    it('rejects the link when the order belongs to another client', async () => {
      const token = await issue.execute(order);
      order = makeOrder(WorkOrderStatus.AWAITING_APPROVAL, 'other-client');

      await expect(get.execute(token)).rejects.toBeInstanceOf(
        WorkOrderApprovalLinkInvalidError,
      );
    });
  });

  describe('DecideWorkOrderApprovalUseCase', () => {
    it('approves the order on behalf of the client bound to the token', async () => {
      const token = await issue.execute(order);

      const result = await decide.execute({
        token,
        decision: WorkOrderApprovalDecision.APPROVE,
      });

      expect(result).toEqual({
        orderNumber: 'OS-0042/2026',
        decision: WorkOrderApprovalDecision.APPROVE,
      });
      expect(changeWorkOrderStatus.execute).toHaveBeenCalledWith({
        id: 'order-id',
        status: WorkOrderStatus.APPROVED,
        note: 'Orçamento aprovado pelo cliente via link do e-mail',
        actor: {
          id: 'client-id',
          username: 'maria.silva',
          entityType: 'client',
        },
        approvalTokenId: approvalTokens.records[0].id,
      });
    });

    it('cancels the order and records the reason when the client rejects', async () => {
      const token = await issue.execute(order);

      await decide.execute({
        token,
        decision: WorkOrderApprovalDecision.REJECT,
        reason: '  Muito caro  ',
      });

      expect(changeWorkOrderStatus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          status: WorkOrderStatus.CANCELLED,
          note: 'Orçamento recusado pelo cliente via link do e-mail: Muito caro',
        }),
      );
    });

    it('uses the default note when the reason is blank', async () => {
      const token = await issue.execute(order);

      await decide.execute({
        token,
        decision: WorkOrderApprovalDecision.REJECT,
        reason: '   ',
      });

      expect(changeWorkOrderStatus.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          note: 'Orçamento recusado pelo cliente via link do e-mail',
        }),
      );
    });

    it('does not change the order with an invalid token', async () => {
      await expect(
        decide.execute({
          token: 'unknown-token',
          decision: WorkOrderApprovalDecision.APPROVE,
        }),
      ).rejects.toBeInstanceOf(WorkOrderApprovalLinkInvalidError);
      expect(changeWorkOrderStatus.execute).not.toHaveBeenCalled();
    });

    it('rejects the link when the client no longer exists', async () => {
      const token = await issue.execute(order);
      users.findById.mockResolvedValue(null);

      await expect(
        decide.execute({ token, decision: WorkOrderApprovalDecision.APPROVE }),
      ).rejects.toBeInstanceOf(WorkOrderApprovalLinkInvalidError);
      expect(changeWorkOrderStatus.execute).not.toHaveBeenCalled();
    });
  });
});
