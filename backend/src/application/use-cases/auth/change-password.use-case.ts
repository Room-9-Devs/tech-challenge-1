import { Inject, Injectable } from '@nestjs/common';
import { AuthenticationError } from '@/domain/errors/authentication.error';
import { USER_REPOSITORY } from '../users/create-user/create-user.use-case';
import { UserRepository } from '@/domain/repositories/user.repository';
import { PASSWORD_HASHER, PasswordHasher } from '@/application/ports/password-hasher.port';
import { REFRESH_TOKEN_REPOSITORY, RefreshTokenRepository } from '@/application/ports/refresh-token.repository';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwords: PasswordHasher,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
  ) { }

  async execute(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user || !(await this.passwords.compare(currentPassword, user.password))) throw new AuthenticationError();
    user.changePassword(await this.passwords.hash(newPassword));
    await this.users.save(user);
    await this.refreshTokens.revokeAllByUserId(user.id);
  }
}