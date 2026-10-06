import { UserRepository } from '@/domain/repositories/user.repository';
import { ProfileRepository } from './profile.repository';

export const USER_REGISTRATION_UNIT_OF_WORK = Symbol(
  'USER_REGISTRATION_UNIT_OF_WORK',
);

export interface UserRegistrationRepositories {
  users: UserRepository;
  profiles: ProfileRepository;
}

export interface UserRegistrationUnitOfWork {
  run<T>(
    work: (repositories: UserRegistrationRepositories) => Promise<T>,
  ): Promise<T>;
}
