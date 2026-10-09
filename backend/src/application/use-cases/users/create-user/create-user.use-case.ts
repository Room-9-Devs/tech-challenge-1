import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { User } from '@/domain/entities/user.entity';
import { UserRepository } from '@/domain/repositories/user.repository';
import { UserAlreadyExistsError } from '@/domain/errors/user-already-exists.error';
import { RoleNotFoundError } from '@/domain/errors/role-not-found.error';
import { InvalidRoleAssignmentError } from '@/domain/errors/invalid-role-assignment.error';
import {
  PASSWORD_HASHER,
  PasswordHasher,
} from '@/application/ports/password-hasher.port';
import {
  USER_REGISTRATION_UNIT_OF_WORK,
  UserRegistrationUnitOfWork,
} from '@/application/ports/user-registration-unit-of-work.port';
import {
  ROLE_REPOSITORY,
  RoleRepository,
} from '@/application/ports/role.repository';
import { CreateUserInputDto } from './create-user-input.dto';
import { CreateUserOutputDto } from './create-user-output.dto';
import { Cpf, Cnpj, Phone } from '@/domain/value-objects';
import { InvalidUserError } from '@/domain/errors/invalid-user.error';
import { DOMAIN_EVENT_PUBLISHER, DomainEventPublisher } from '@/application/ports/domain-event-publisher.port';
import { UserCreatedEvent } from '@/domain/events/user.events';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(USER_REGISTRATION_UNIT_OF_WORK)
    private readonly registration: UserRegistrationUnitOfWork,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async execute(input: CreateUserInputDto): Promise<CreateUserOutputDto> {
    const documentVo =
      input.documentType === 'CPF'
        ? new Cpf(input.document)
        : input.documentType === 'CNPJ'
          ? new Cnpj(input.document)
          : (() => {
              throw new InvalidUserError('Tipo de documento inválido');
            })();

    const document = documentVo.value;
    const phoneVo = new Phone(input.phone);
    const phone = phoneVo.value;

    const existingUser = await this.userRepository.findByEmail(
      input.email.toLowerCase(),
    );
    const existingUsername = await this.userRepository.findByUsername(
      input.username,
    );

    if (existingUser || existingUsername)
      throw new UserAlreadyExistsError(input.email);

    const role = await this.roleRepository.findBySlug(
      input.entityType === 'client' ? 'client' : 'staff',
    );
    if (!role)
      throw new RoleNotFoundError(
        input.entityType === 'client' ? 'client' : 'staff',
      );
    if (!User.isRoleAllowed(input.entityType, role.slug)) {
      throw new InvalidRoleAssignmentError(input.entityType, role.slug);
    }

    const profileId = randomUUID();
    const user = User.create({
      username: input.username,
      email: input.email,
      password: await this.passwordHasher.hash(input.password),
      entityType: input.entityType,
      entityId: profileId,
      roleId: role.id,
    });

    const result = await this.registration.run(async ({ users, profiles }) => {
      const profileInput = {
        id: profileId,
        name: input.name,
        documentType: input.documentType,
        document,
        phone,
      };
      const profile =
        input.entityType === 'client'
          ? await profiles.createClient(profileInput)
          : await profiles.createEmployee({
              ...profileInput,
              jobTitle: input.jobTitle,
            });
      const savedUser = await users.save(user);
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
    });

    await this.eventPublisher.publish(
      new UserCreatedEvent(result.id, input.createdBy, {
        username: result.username,
        email: result.email,
        role: result.role,
      }),
    );

    return result;
  }
}
