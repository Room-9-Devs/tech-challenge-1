import { Injectable, Inject } from '@nestjs/common';
import { UserRepository } from '@/domain/repositories/user.repository';
import { UserNotFoundError } from '@/domain/errors/user-not-found.error';
import { UserAlreadyExistsError } from '@/domain/errors/user-already-exists.error';
import {
  PROFILE_REPOSITORY,
  ProfileRepository,
} from '@/application/ports/profile.repository';
import {
  ROLE_REPOSITORY,
  RoleRepository,
} from '@/application/ports/role.repository';
import { USER_REPOSITORY } from '../create-user/create-user.use-case';
import { UpdateUserInputDto } from './update-user-input.dto';
import { UpdateUserOutputDto } from './update-user-output.dto';
import { maskProfile } from '../mask-profile';
import {
  DOMAIN_EVENT_PUBLISHER,
  DomainEventPublisher,
} from '@/application/ports/domain-event-publisher.port';
import { UserUpdatedEvent } from '@/domain/events/user.events';
import { Phone } from '@/domain/value-objects';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PROFILE_REPOSITORY)
    private readonly profileRepository: ProfileRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async execute(
    input: UpdateUserInputDto & { id: string; updatedBy?: string },
  ): Promise<UpdateUserOutputDto> {
    const { id, username, email, profile, updatedBy } = input;

    const user = await this.userRepository.findById(id);
    if (!user) throw new UserNotFoundError(id);

    const oldMeta: Record<string, unknown> = {};
    const newMeta: Record<string, unknown> = {};

    if (email !== undefined && email.toLowerCase() !== user.email) {
      const existingByEmail = await this.userRepository.findByEmail(email);
      if (existingByEmail && existingByEmail.id !== user.id) {
        throw new UserAlreadyExistsError(email);
      }
      oldMeta.email = user.email;
      user.changeEmail(email);
      newMeta.email = user.email;
    }

    if (username !== undefined && username !== user.username) {
      const existingByUsername = await this.userRepository.findByUsername(username);
      if (existingByUsername && existingByUsername.id !== user.id) {
        throw new UserAlreadyExistsError(username);
      }
      oldMeta.username = user.username;
      user.changeUsername(username);
      newMeta.username = user.username;
    }

    const profileData = { ...(profile ?? {}) };
    // jobTitle só existe no perfil de employee
    if (user.entityType !== 'employee') {
      delete profileData.jobTitle;
    }
    // O telefone é gravado só com dígitos; validação via Phone e normalização.
    if (typeof (profileData as Record<string, unknown>).phone === 'string') {
      (profileData as Record<string, unknown>).phone = new Phone((profileData as Record<string, unknown>).phone as string).value;
    }

    const effectiveProfileKeys = (
      ['name', 'phone', 'jobTitle'] as const
    ).filter((key) => (profileData as Record<string, unknown>)[key] !== undefined);

    if (effectiveProfileKeys.length > 0) {
      const existingProfile = await this.profileRepository.findById(
        user.entityType,
        user.entityId,
      );
      for (const key of effectiveProfileKeys) {
        oldMeta[`profile.${key}`] = (existingProfile as unknown as Record<string, unknown> | null)?.[key];
        newMeta[`profile.${key}`] = (profileData as unknown as Record<string, unknown>)[key];
      }
      await this.profileRepository.update(user.entityType, user.entityId, profileData);
    }

    if (Object.keys(newMeta).length > 0) {
      await this.eventPublisher.publish(
        new UserUpdatedEvent(user.id, updatedBy, {
          changedFields: Object.keys(newMeta),
          old: oldMeta,
          new: newMeta,
        }),
      );
    }

    const updatedUser = await this.userRepository.save(user);
    const updatedProfile = await this.profileRepository.findById(
      user.entityType,
      user.entityId,
    );

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      entityType: updatedUser.entityType,
      entityId: updatedUser.entityId,
      profile: updatedProfile ? maskProfile(updatedProfile) : {},
      role: (await this.roleRepository.findById(updatedUser.roleId))?.slug || updatedUser.roleId,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }
}
