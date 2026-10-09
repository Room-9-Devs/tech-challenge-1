import { Inject, Injectable } from '@nestjs/common';
import { UserNotFoundError } from '@/domain/errors/user-not-found.error';
import { RoleNotFoundError } from '@/domain/errors/role-not-found.error';
import { UserRepository } from '@/domain/repositories/user.repository';
import { ROLE_REPOSITORY, RoleRepository } from '@/application/ports/role.repository';
import { USER_REPOSITORY } from '../users/create-user/create-user.use-case';
import { DOMAIN_EVENT_PUBLISHER, DomainEventPublisher } from '@/application/ports/domain-event-publisher.port';
import { UserRoleChangedEvent } from '@/domain/events/user.events';

@Injectable()
export class ChangeRoleUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER) private readonly eventPublisher: DomainEventPublisher,
  ) { }

  async execute(userId: string, roleSlug: string): Promise<void> {
    const normalizedRoleSlug = roleSlug.trim().toLowerCase();
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UserNotFoundError(userId);

    const role = await this.roleRepository.findBySlug(normalizedRoleSlug);
    if (!role) throw new RoleNotFoundError(normalizedRoleSlug);

    const oldRole = await this.roleRepository.findById(user.roleId);

    user.changeRole(role.id, role.slug);
    await this.userRepository.save(user);

    await this.eventPublisher.publish(
      new UserRoleChangedEvent(user.id, user.username, {
        oldRole: oldRole?.slug ?? user.roleId,
        newRole: role.slug,
      }),
    );
  }
}