import { Injectable, Inject } from '@nestjs/common';
import { UserRepository } from '@/domain/repositories/user.repository';
import { USER_REPOSITORY } from '../create-user/create-user.use-case';
import { ROLE_REPOSITORY, RoleRepository } from '@/application/ports/role.repository';
import { CurrentUser } from '@/infrastructure/http/auth/current-user.type';

@Injectable()
export class FindCurrentUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: RoleRepository,
  ) {}

  async execute(userId: string): Promise<CurrentUser | null> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return null;
    }

    const role = await this.roleRepository.findById(user.roleId);

    return {
      id: user.id,
      username: user.username,
      role: role?.slug || user.roleId,
      entityType: user.entityType,
    };
  }
}
