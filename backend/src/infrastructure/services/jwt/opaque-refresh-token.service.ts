import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { RefreshTokenService } from '@/application/ports/refresh-token-service.port';

@Injectable()
export class OpaqueRefreshTokenService implements RefreshTokenService {
  generate(): string {
    return randomBytes(48).toString('base64url');
  }

  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
