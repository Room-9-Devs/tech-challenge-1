import {
  NewWorkOrderApprovalToken,
  WorkOrderApprovalTokenRecord,
  WorkOrderApprovalTokenRepository,
} from '@/application/ports/work-order-approval-token.repository';

export class FakeWorkOrderApprovalTokenRepository implements WorkOrderApprovalTokenRepository {
  records: WorkOrderApprovalTokenRecord[] = [];
  private sequence = 0;

  async save(
    token: NewWorkOrderApprovalToken,
  ): Promise<WorkOrderApprovalTokenRecord> {
    const saved = {
      ...token,
      id: `approval-${++this.sequence}`,
      usedAt: null,
      revokedAt: null,
    };
    this.records.push(saved);
    return saved;
  }

  async findValidByHash(
    tokenHash: string,
  ): Promise<WorkOrderApprovalTokenRecord | null> {
    return (
      this.records.find(
        (record) => record.tokenHash === tokenHash && this.isValid(record),
      ) ?? null
    );
  }

  async markUsed(id: string): Promise<boolean> {
    const record = this.records.find((item) => item.id === id);
    if (!record || !this.isValid(record)) return false;
    record.usedAt = new Date();
    return true;
  }

  async revokeAllByWorkOrder(workOrderId: string): Promise<void> {
    this.records
      .filter(
        (record) =>
          record.workOrderId === workOrderId &&
          !record.usedAt &&
          !record.revokedAt,
      )
      .forEach((record) => {
        record.revokedAt = new Date();
      });
  }

  private isValid(record: WorkOrderApprovalTokenRecord): boolean {
    return !record.usedAt && !record.revokedAt && record.expiresAt > new Date();
  }
}
