import { Injectable, Inject } from '@nestjs/common';
import { UserRepository } from '@/domain/repositories/user.repository';
import { USER_REPOSITORY } from '../create-user/create-user.use-case';
import { ListUsersOutputDto } from './list-users-output.dto';
import { PROFILE_REPOSITORY, ProfileRepository } from '@/application/ports/profile.repository';
import { ROLE_REPOSITORY, RoleRepository } from '@/application/ports/role.repository';
import { maskProfile } from '../mask-profile';
import { ListUsersInputDto } from './list-users-input.dto';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PROFILE_REPOSITORY) private readonly profileRepository: ProfileRepository,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
  ) { }

  async execute(input: ListUsersInputDto = {}): Promise<ListUsersOutputDto> {
    const { filters, ...paginationQuery } = input;

    const { data, meta } = await this.userRepository.findAll({
      page: paginationQuery.page ?? 1,
      limit: paginationQuery.limit ?? 10,
      search: paginationQuery.search,
      sort: paginationQuery.sort,
      filters,
    });

    return {
      data: await Promise.all(data.map(async (user) => {
        const profile = await this.profileRepository.findById(user.entityType, user.entityId);
        return {
          id: user.id,
          username: user.username,
          email: user.email,
          entityType: user.entityType,
          entityId: user.entityId,
          role: (await this.roleRepository.findById(user.roleId))?.slug || user.roleId,
          profile: profile ? maskProfile(profile) : {},
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        };
      })),
      meta,
    };
  }
}