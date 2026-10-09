import { Injectable, Inject } from '@nestjs/common';
import { UserRepository } from '@/domain/repositories/user.repository';
import { USER_REPOSITORY } from '../create-user/create-user.use-case';
import { CurrentUser } from '@/infrastructure/http/auth/current-user.type';

@Injectable()
export class FindCurrentUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: string): Promise<CurrentUser | null> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      username: user.username,
      role: user.roleId,
      entityType: user.entityType,
    };
  }
}
