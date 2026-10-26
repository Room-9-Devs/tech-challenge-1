import { AccessTokenPayload, TokenService } from '@/application/ports/token-service.port';
import { RefreshTokenService } from '@/application/ports/refresh-token-service.port';

export class FakeTokenService implements TokenService {
  sign(payload: AccessTokenPayload): string { return `access:${payload.sub}:${payload.role}`; }
  verify(token: string): AccessTokenPayload { return { sub: token, role: 'client', entityType: 'client' }; }
}

export class FakeRefreshTokenService implements RefreshTokenService {
  private sequence = 0;
  generate(): string { return `refresh-${++this.sequence}`; }
  hash(token: string): string { return `hash:${token}`; }
}
