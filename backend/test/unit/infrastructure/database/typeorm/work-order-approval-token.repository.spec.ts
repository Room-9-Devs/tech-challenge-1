import { IsNull, MoreThan } from 'typeorm';
import { TypeOrmWorkOrderApprovalTokenRepository } from '@/infrastructure/database/typeorm/repositories/typeorm-work-order-approval-token.repository';
import { CreateWorkOrderApprovalTokens1791700000000 } from '@/infrastructure/database/typeorm/migrations/1791700000000-create-work-order-approval-tokens';

describe('TypeOrmWorkOrderApprovalTokenRepository', () => {
  const entity = {
    id: 'approval-id',
    workOrderId: 'order-id',
    clientId: 'client-id',
    tokenHash: 'hash',
    expiresAt: new Date('2026-10-10T00:00:00Z'),
    usedAt: null,
    revokedAt: null,
    createdAt: new Date(),
  };
  let ormRepository: any;
  let repository: TypeOrmWorkOrderApprovalTokenRepository;

  beforeEach(() => {
    ormRepository = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ ...value, id: 'approval-id' })),
      findOne: jest.fn().mockResolvedValue(entity),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    repository = new TypeOrmWorkOrderApprovalTokenRepository(ormRepository);
  });

  it('saves a new token without usage or revocation', async () => {
    const saved = await repository.save({
      workOrderId: 'order-id',
      clientId: 'client-id',
      tokenHash: 'hash',
      expiresAt: entity.expiresAt,
    });

    expect(saved).toEqual({
      id: 'approval-id',
      workOrderId: 'order-id',
      clientId: 'client-id',
      tokenHash: 'hash',
      expiresAt: entity.expiresAt,
      usedAt: null,
      revokedAt: null,
    });
  });

  it('finds only tokens that are unused, not revoked and not expired', async () => {
    const found = await repository.findValidByHash('hash');

    expect(ormRepository.findOne).toHaveBeenCalledWith({
      where: {
        tokenHash: 'hash',
        usedAt: IsNull(),
        revokedAt: IsNull(),
        expiresAt: expect.any(MoreThan(new Date()).constructor),
      },
    });
    expect(found?.id).toBe('approval-id');
    ormRepository.findOne.mockResolvedValue(null);
    await expect(repository.findValidByHash('other')).resolves.toBeNull();
  });

  it('marks a token as used only when the conditional update affects it', async () => {
    await expect(repository.markUsed('approval-id')).resolves.toBe(true);
    expect(ormRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'approval-id',
        usedAt: IsNull(),
        revokedAt: IsNull(),
      }),
      { usedAt: expect.any(Date) },
    );

    ormRepository.update.mockResolvedValue({ affected: 0 });
    await expect(repository.markUsed('approval-id')).resolves.toBe(false);
  });

  it('revokes only the pending tokens of the order', async () => {
    await repository.revokeAllByWorkOrder('order-id');

    expect(ormRepository.update).toHaveBeenCalledWith(
      { workOrderId: 'order-id', usedAt: IsNull(), revokedAt: IsNull() },
      { revokedAt: expect.any(Date) },
    );
  });
});

describe('CreateWorkOrderApprovalTokens migration', () => {
  it('creates and drops the approval tokens table', async () => {
    const queryRunner = { query: jest.fn().mockResolvedValue(undefined) };
    const migration = new CreateWorkOrderApprovalTokens1791700000000();

    await migration.up(queryRunner as never);
    await migration.down(queryRunner as never);

    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE "work_order_approval_tokens"'),
    );
    expect(queryRunner.query).toHaveBeenCalledWith(
      expect.stringContaining(
        'REFERENCES "work_orders"("id") ON DELETE CASCADE',
      ),
    );
    expect(queryRunner.query).toHaveBeenLastCalledWith(
      'DROP TABLE "work_order_approval_tokens"',
    );
  });
});
