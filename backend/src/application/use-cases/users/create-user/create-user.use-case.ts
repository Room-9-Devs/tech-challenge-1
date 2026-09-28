import { Injectable, Inject } from '@nestjs/common';
import { User } from '@/domain/entities/user.entity';
import { UserRepository } from '@/domain/repositories/user.repository';
import { UserAlreadyExistsError } from '@/domain/errors/user-already-exists.error';
import { CreateUserInputDto } from './create-user-input.dto';
import { CreateUserOutputDto } from './create-user-output.dto';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: CreateUserInputDto): Promise<CreateUserOutputDto> {
    const existingUser = await this.userRepository.findByEmail(input.email);

    if (existingUser) {
      throw new UserAlreadyExistsError(input.email);
    }

    const user = User.create({
      name: input.name,
      email: input.email,
    });

    const savedUser = await this.userRepository.save(user);

    return {
      id: savedUser.id,
      name: savedUser.name,
      email: savedUser.email,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt,
    };
  }
}
