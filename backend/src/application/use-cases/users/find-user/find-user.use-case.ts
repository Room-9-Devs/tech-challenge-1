import { Injectable, Inject } from '@nestjs/common';
import { UserRepository } from '@/domain/repositories/user.repository';
import { UserNotFoundError } from '@/domain/errors/user-not-found.error';
import { USER_REPOSITORY } from '../create-user/create-user.use-case';
import { FindUserInputDto } from './find-user-input.dto';
import { FindUserOutputDto } from './find-user-output.dto';

@Injectable()
export class FindUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: FindUserInputDto): Promise<FindUserOutputDto> {
    const user = await this.userRepository.findById(input.id);

    if (!user) {
      throw new UserNotFoundError(input.id);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
