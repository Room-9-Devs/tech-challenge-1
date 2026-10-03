import { Inject, Injectable } from '@nestjs/common';
import { UserNotFoundError } from '@/domain/errors/user-not-found.error';
import { RoleNotFoundError } from '@/domain/errors/role-not-found.error';
import { UserRepository } from '@/domain/repositories/user.repository';
import { ROLE_REPOSITORY, RoleRepository } from '@/application/ports/role.repository';
import { USER_REPOSITORY } from '../users/create-user/create-user.use-case';

@Injectable()
export class ChangeRoleUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
  ) { }

  async execute(userId: string, roleSlug: string): Promise<void> {
    const normalizedRoleSlug = roleSlug.trim().toLowerCase();
    const user = await this.userRepository.findById(userId);
    if (!user) throw new UserNotFoundError(userId);

    const role = await this.roleRepository.findBySlug(normalizedRoleSlug);
    if (!role) throw new RoleNotFoundError(normalizedRoleSlug);

    user.changeRole(role.id, role.slug);
    await this.userRepository.save(user);
  }
}