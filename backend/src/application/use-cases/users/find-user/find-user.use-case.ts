import { Injectable, Inject } from '@nestjs/common';
import { UserRepository } from '@/domain/repositories/user.repository';
import { UserNotFoundError } from '@/domain/errors/user-not-found.error';
import { PROFILE_REPOSITORY, ProfileRepository } from '@/application/ports/profile.repository';
import { ROLE_REPOSITORY, RoleRepository } from '@/application/ports/role.repository';
import { USER_REPOSITORY } from '../create-user/create-user.use-case';
import { FindUserInputDto } from './find-user-input.dto';
import { FindUserOutputDto } from './find-user-output.dto';

@Injectable()
export class FindUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PROFILE_REPOSITORY) private readonly profileRepository: ProfileRepository,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
  ) { }

  async execute(input: FindUserInputDto): Promise<FindUserOutputDto> {
    const user = await this.userRepository.findById(input.id);

    if (!user) {
      throw new UserNotFoundError(input.id);
    }

    const profile = await this.profileRepository.findById(user.entityType, user.entityId);
    const role = await this.roleRepository.findById(user.roleId);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      entityType: user.entityType,
      entityId: user.entityId,
      role: role?.slug || user.roleId,
      profile: profile || {},
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
