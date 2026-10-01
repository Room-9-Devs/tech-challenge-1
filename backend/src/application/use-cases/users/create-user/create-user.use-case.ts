import { Injectable, Inject } from '@nestjs/common';
import { User } from '@/domain/entities/user.entity';
import { UserRepository } from '@/domain/repositories/user.repository';
import { UserAlreadyExistsError } from '@/domain/errors/user-already-exists.error';
import { PASSWORD_HASHER, PasswordHasher } from '@/application/ports/password-hasher.port';
import { PROFILE_REPOSITORY, ProfileRepository } from '@/application/ports/profile.repository';
import { ROLE_REPOSITORY, RoleRepository } from '@/application/ports/role.repository';
import { CreateUserInputDto } from './create-user-input.dto';
import { CreateUserOutputDto } from './create-user-output.dto';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(PROFILE_REPOSITORY) private readonly profileRepository: ProfileRepository,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
  ) { }

  async execute(input: CreateUserInputDto): Promise<CreateUserOutputDto> {
    const existingUser = await this.userRepository.findByEmail(input.email.toLowerCase());
    const existingUsername = await this.userRepository.findByUsername(input.username);

    if (existingUser || existingUsername) throw new UserAlreadyExistsError(input.email);

    const role = await this.roleRepository.findBySlug(input.entityType === 'client' ? 'client' : 'staff');
    if (!role) throw new Error('Default role was not found');

    const profile = input.entityType === 'client'
      ? await this.profileRepository.createClient({
        name: input.name,
        documentType: input.documentType,
        document: input.document,
        phone: input.phone,
      })
      : await this.profileRepository.createEmployee({
        name: input.name,
        documentType: input.documentType,
        document: input.document,
        phone: input.phone,
        jobTitle: input.jobTitle,
      });

    const user = User.create({
      username: input.username,
      email: input.email,
      password: await this.passwordHasher.hash(input.password),
      entityType: input.entityType,
      entityId: profile.id,
      roleId: role.id,
    });

    const savedUser = await this.userRepository.save(user);

    return {
      id: savedUser.id,
      username: savedUser.username,
      email: savedUser.email,
      entityType: savedUser.entityType,
      entityId: savedUser.entityId,
      role: role.slug,
      profile,
      createdAt: savedUser.createdAt,
      updatedAt: savedUser.updatedAt,
    };
  }
}
