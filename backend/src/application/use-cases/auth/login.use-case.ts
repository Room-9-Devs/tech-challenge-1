import { Inject, Injectable } from '@nestjs/common';
import { AuthenticationError } from '@/domain/errors/authentication.error';
import { USER_REPOSITORY } from '../users/create-user/create-user.use-case';
import { UserRepository } from '@/domain/repositories/user.repository';
import { PASSWORD_HASHER, PasswordHasher } from '@/application/ports/password-hasher.port';
import { ROLE_REPOSITORY, RoleRepository } from '@/application/ports/role.repository';
import { REFRESH_TOKEN_REPOSITORY, RefreshTokenRepository } from '@/application/ports/refresh-token.repository';
import { REFRESH_TOKEN_SERVICE, RefreshTokenService } from '@/application/ports/refresh-token-service.port';
import { TOKEN_SERVICE, TokenService } from '@/application/ports/token-service.port';

export interface LoginInput { login: string; password: string; }
export interface LoginOutput { accessToken: string; refreshToken: string; expiresIn: number; user: { id: string; username: string; email: string; role: string; entityType: string; }; }

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwords: PasswordHasher,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
    @Inject(REFRESH_TOKEN_SERVICE) private readonly refreshTokenService: RefreshTokenService,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) { }

  async execute(input: LoginInput): Promise<LoginOutput> {
    const login = input.login.toLowerCase();
    const user = login.includes('@') ? await this.users.findByEmail(login) : await this.users.findByUsername(input.login);
    if (!user || !(await this.passwords.compare(input.password, user.password))) throw new AuthenticationError();
    const role = await this.roles.findById(user.roleId);
    const accessToken = this.tokens.sign({ sub: user.id, role: role?.slug || user.roleId, entityType: user.entityType });
    const refreshToken = this.refreshTokenService.generate();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await this.refreshTokens.save({ userId: user.id, tokenHash: this.refreshTokenService.hash(refreshToken), expiresAt, revokedAt: null });
    return { accessToken, refreshToken, expiresIn: 900, user: { id: user.id, username: user.username, email: user.email, role: role?.slug || user.roleId, entityType: user.entityType } };
  }
}