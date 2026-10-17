import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import {
  NewWorkOrderApprovalToken,
  WorkOrderApprovalTokenRecord,
  WorkOrderApprovalTokenRepository,
} from '@/application/ports/work-order-approval-token.repository';
import { WorkOrderApprovalTokenOrmEntity } from '../entities/work-order-approval-token.orm-entity';

@Injectable()
export class TypeOrmWorkOrderApprovalTokenRepository implements WorkOrderApprovalTokenRepository {
  constructor(
    @InjectRepository(WorkOrderApprovalTokenOrmEntity)
    private readonly repository: Repository<WorkOrderApprovalTokenOrmEntity>,
  ) {}

  async save(
    token: NewWorkOrderApprovalToken,
  ): Promise<WorkOrderApprovalTokenRecord> {
    const saved = await this.repository.save(this.repository.create(token));
    return this.toRecord(saved);
  }

  async findValidByHash(
    tokenHash: string,
  ): Promise<WorkOrderApprovalTokenRecord | null> {
    const token = await this.repository.findOne({
      where: {
        tokenHash,
        usedAt: IsNull(),
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
    });
    return token ? this.toRecord(token) : null;
  }

  // UPDATE condicional: só um dos cliques concorrentes consegue marcar o token.
  async markUsed(id: string): Promise<boolean> {
    const result = await this.repository.update(
      {
        id,
        usedAt: IsNull(),
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      { usedAt: new Date() },
    );
    return result.affected === 1;
  }

  async revokeAllByWorkOrder(workOrderId: string): Promise<void> {
    await this.repository.update(
      { workOrderId, usedAt: IsNull(), revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  private toRecord(
    entity: WorkOrderApprovalTokenOrmEntity,
  ): WorkOrderApprovalTokenRecord {
    return {
      id: entity.id,
      workOrderId: entity.workOrderId,
      clientId: entity.clientId,
      tokenHash: entity.tokenHash,
      expiresAt: entity.expiresAt,
      usedAt: entity.usedAt ?? null,
      revokedAt: entity.revokedAt ?? null,
    };
  }
}
