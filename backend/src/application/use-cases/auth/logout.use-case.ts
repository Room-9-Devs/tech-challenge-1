import { Inject, Injectable } from '@nestjs/common';
import { REFRESH_TOKEN_REPOSITORY, RefreshTokenRepository } from '@/application/ports/refresh-token.repository';
import { REFRESH_TOKEN_SERVICE, RefreshTokenService } from '@/application/ports/refresh-token-service.port';
import { DOMAIN_EVENT_PUBLISHER, DomainEventPublisher } from '@/application/ports/domain-event-publisher.port';
import { AuthLogoutSucceededEvent } from '@/domain/events/auth.events';
import { UserRepository } from '@/domain/repositories/user.repository';
import { USER_REPOSITORY } from '../users/create-user/create-user.use-case';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
    @Inject(REFRESH_TOKEN_SERVICE) private readonly tokenService: RefreshTokenService,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly eventPublisher: DomainEventPublisher,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
  ) { }

  async execute(refreshToken: string): Promise<void> {
    const record = await this.refreshTokens.findValidByHash(this.tokenService.hash(refreshToken));
    if (record) {
      await this.refreshTokens.revoke(record.id);
      const user = await this.users.findById(record.userId);
      await this.eventPublisher.publish(
        new AuthLogoutSucceededEvent(record.userId, user?.username, { userId: record.userId }),
      );
    }
  }
}