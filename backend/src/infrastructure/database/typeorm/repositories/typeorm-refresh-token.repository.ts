import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { RefreshTokenRepository, RefreshTokenRecord } from '@/application/ports/refresh-token.repository';
import { RefreshTokenOrmEntity } from '../entities/refresh-token.orm-entity';

@Injectable()
export class TypeOrmRefreshTokenRepository implements RefreshTokenRepository {
  constructor(@InjectRepository(RefreshTokenOrmEntity) private readonly repository: Repository<RefreshTokenOrmEntity>) {}

  async save(record: Omit<RefreshTokenRecord, 'id'>): Promise<RefreshTokenRecord> {
    const saved = await this.repository.save(this.repository.create(record));
    return this.toRecord(saved);
  }

  async findByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const token = await this.repository.findOne({ where: { tokenHash } });
    return token ? this.toRecord(token) : null;
  }

  async findValidByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const token = await this.repository.findOne({ where: { tokenHash, revokedAt: IsNull(), expiresAt: MoreThan(new Date()) } });
    return token ? this.toRecord(token) : null;
  }

  async revoke(id: string): Promise<void> {
    await this.repository.update({ id }, { revokedAt: new Date() });
  }

  async revokeIfActive(id: string): Promise<boolean> {
    const result = await this.repository.update({ id, revokedAt: IsNull() }, { revokedAt: new Date() });
    return (result.affected ?? 0) === 1;
  }

  async revokeAllByUserId(userId: string): Promise<void> {
    await this.repository.update({ userId, revokedAt: IsNull() }, { revokedAt: new Date() });
  }

  private toRecord(entity: RefreshTokenOrmEntity): RefreshTokenRecord {
    return { id: entity.id, userId: entity.userId, tokenHash: entity.tokenHash, expiresAt: entity.expiresAt, revokedAt: entity.revokedAt };
  }
}
