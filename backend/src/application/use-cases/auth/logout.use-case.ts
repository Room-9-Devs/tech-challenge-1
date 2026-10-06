import { Inject, Injectable } from '@nestjs/common';
import { REFRESH_TOKEN_REPOSITORY, RefreshTokenRepository } from '@/application/ports/refresh-token.repository';
import { REFRESH_TOKEN_SERVICE, RefreshTokenService } from '@/application/ports/refresh-token-service.port';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
    @Inject(REFRESH_TOKEN_SERVICE) private readonly tokenService: RefreshTokenService,
  ) { }

  async execute(refreshToken: string): Promise<void> {
    const record = await this.refreshTokens.findValidByHash(this.tokenService.hash(refreshToken));
    if (record) await this.refreshTokens.revoke(record.id);
  }
}