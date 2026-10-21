import { Injectable, Inject } from '@nestjs/common';
import { UserRepository } from '@/domain/repositories/user.repository';
import { UserNotFoundError } from '@/domain/errors/user-not-found.error';
import { USER_REPOSITORY } from '../create-user/create-user.use-case';
import {
  REFRESH_TOKEN_REPOSITORY,
  RefreshTokenRepository,
} from '@/application/ports/refresh-token.repository';
import { DeleteUserInputDto } from './delete-user-input.dto';
import {
  DOMAIN_EVENT_PUBLISHER,
  DomainEventPublisher,
} from '@/application/ports/domain-event-publisher.port';
import { UserDeletedEvent } from '@/domain/events/user.events';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async execute(input: DeleteUserInputDto): Promise<void> {
    const user = await this.userRepository.findById(input.id);
    if (!user) throw new UserNotFoundError(input.id);

    const originalUsername = user.username;
    const originalEmail = user.email;

    user.deactivate();
    await this.userRepository.save(user);

    await this.refreshTokenRepository.revokeAllByUserId(user.id);

    await this.eventPublisher.publish(
      new UserDeletedEvent(user.id, input.deletedBy, {
        username: originalUsername,
        email: originalEmail,
      }),
    );
  }
}
