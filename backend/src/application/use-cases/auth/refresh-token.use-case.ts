import { Inject, Injectable } from '@nestjs/common';
import { RefreshTokenInvalidError } from '@/domain/errors/refresh-token-invalid.error';
import { USER_REPOSITORY } from '../users/create-user/create-user.use-case';
import { UserRepository } from '@/domain/repositories/user.repository';
import { ROLE_REPOSITORY, RoleRepository } from '@/application/ports/role.repository';
import { REFRESH_TOKEN_REPOSITORY, RefreshTokenRepository } from '@/application/ports/refresh-token.repository';
import { REFRESH_TOKEN_SERVICE, RefreshTokenService } from '@/application/ports/refresh-token-service.port';
import { TOKEN_SERVICE, TokenService } from '@/application/ports/token-service.port';

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
    @Inject(REFRESH_TOKEN_SERVICE) private readonly refreshTokenService: RefreshTokenService,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) { }

  async execute(refreshToken: string): Promise<{ accessToken: string; refreshToken: string; expiresIn: number }> {
    const record = await this.refreshTokens.findValidByHash(this.refreshTokenService.hash(refreshToken));
    if (!record) throw new RefreshTokenInvalidError();
    const user = await this.users.findById(record.userId);
    if (!user) throw new RefreshTokenInvalidError();
    await this.refreshTokens.revoke(record.id);
    const role = await this.roles.findById(user.roleId);
    const nextRefreshToken = this.refreshTokenService.generate();
    await this.refreshTokens.save({ userId: user.id, tokenHash: this.refreshTokenService.hash(nextRefreshToken), expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), revokedAt: null });
    return { accessToken: this.tokens.sign({ sub: user.id, role: role?.slug || user.roleId, entityType: user.entityType }), refreshToken: nextRefreshToken, expiresIn: 900 };
  }
}