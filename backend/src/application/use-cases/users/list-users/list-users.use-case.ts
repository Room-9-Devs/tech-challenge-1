import { Injectable, Inject } from '@nestjs/common';
import { UserRepository } from '@/domain/repositories/user.repository';
import { USER_REPOSITORY } from '../create-user/create-user.use-case';
import { ListUsersOutputDto } from './list-users-output.dto';
import { PROFILE_REPOSITORY, ProfileRepository } from '@/application/ports/profile.repository';
import { ROLE_REPOSITORY, RoleRepository } from '@/application/ports/role.repository';
import { UserFilter } from '@/domain/repositories/user.repository';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PROFILE_REPOSITORY) private readonly profileRepository: ProfileRepository,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
  ) { }

  async execute(input?: UserFilter): Promise<ListUsersOutputDto> {
    const users = await this.userRepository.findAll(input);

    return {
      users: await Promise.all(users.map(async (user) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        entityType: user.entityType,
        entityId: user.entityId,
        role: (await this.roleRepository.findById(user.roleId))?.slug || user.roleId,
        profile: (await this.profileRepository.findById(user.entityType, user.entityId)) || {},
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }))),
    };
  }
}
