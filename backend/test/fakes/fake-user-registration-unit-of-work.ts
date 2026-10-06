import {
  UserRegistrationRepositories,
  UserRegistrationUnitOfWork,
} from '@/application/ports/user-registration-unit-of-work.port';
import { FakeUserRepository } from './fake-user.repository';
import { FakeProfileRepository } from './fake-profile.repository';

export class FakeUserRegistrationUnitOfWork implements UserRegistrationUnitOfWork {
  constructor(
    private readonly users: FakeUserRepository,
    private readonly profiles: FakeProfileRepository,
  ) {}

  async run<T>(
    work: (repositories: UserRegistrationRepositories) => Promise<T>,
  ): Promise<T> {
    const users = this.users.snapshot();
    const profiles = this.profiles.snapshot();
    try {
      return await work({ users: this.users, profiles: this.profiles });
    } catch (error) {
      this.users.restore(users);
      this.profiles.restore(profiles);
      throw error;
    }
  }
}
