import { RefreshTokenRecord, RefreshTokenRepository } from '@/application/ports/refresh-token.repository';

export class FakeRefreshTokenRepository implements RefreshTokenRepository {
  records: RefreshTokenRecord[] = [];
  private sequence = 0;

  async save(record: Omit<RefreshTokenRecord, 'id'>): Promise<RefreshTokenRecord> {
    const saved = { ...record, id: `refresh-${++this.sequence}` };
    this.records.push(saved);
    return saved;
  }

  async findByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    return this.records.find((record) => record.tokenHash === tokenHash) || null;
  }

  async findValidByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    return this.records.find((record) => record.tokenHash === tokenHash && !record.revokedAt && record.expiresAt > new Date()) || null;
  }

  async revoke(id: string): Promise<void> {
    const record = this.records.find((item) => item.id === id);
    if (record) record.revokedAt = new Date();
  }

  async revokeIfActive(id: string): Promise<boolean> {
    const record = this.records.find((item) => item.id === id);
    if (!record || record.revokedAt) return false;
    record.revokedAt = new Date();
    return true;
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    this.records.filter((record) => record.userId === userId).forEach((record) => { record.revokedAt = new Date(); });
  }
}
