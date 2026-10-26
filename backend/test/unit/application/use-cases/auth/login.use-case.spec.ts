import { LoginUseCase } from '@/application/use-cases/auth/login.use-case';
import { FakeUserRepository } from '../../../../fakes/fake-user.repository';
import { FakeRoleRepository } from '../../../../fakes/fake-role.repository';
import { FakeRefreshTokenRepository } from '../../../../fakes/fake-refresh-token.repository';
import { FakePasswordHasher } from '../../../../fakes/fake-password-hasher';
import { FakeRefreshTokenService, FakeTokenService } from '../../../../fakes/fake-token-services';
import { makeUser } from '../../../../fakes/user-fixture';
import { AuthenticationError } from '@/domain/errors/authentication.error';
import { FakeDomainEventPublisher } from '../../../../fakes/fake-domain-event-publisher';

describe('LoginUseCase', () => {
  let users: FakeUserRepository;
  let refreshTokens: FakeRefreshTokenRepository;
  let useCase: LoginUseCase;

  beforeEach(async () => {
    users = new FakeUserRepository();
    await users.save(makeUser({ password: 'hash:password123', roleId: 'role-staff' }));
    refreshTokens = new FakeRefreshTokenRepository();
    useCase = new LoginUseCase(users, new FakePasswordHasher(), new FakeRoleRepository(), refreshTokens, new FakeRefreshTokenService(), new FakeTokenService(), new FakeDomainEventPublisher());
  });

  it('authenticates by email and persists a hashed refresh token', async () => {
    const result = await useCase.execute({ login: 'JOSE@EXAMPLE.COM', password: 'password123' });

    expect(result.accessToken).toBe('access:user-1:staff');
    expect(result.refreshToken).toBe('refresh-1');
    expect(refreshTokens.records).toHaveLength(1);
    expect(refreshTokens.records[0].tokenHash).toBe('hash:refresh-1');
  });

  it('rejects invalid credentials', async () => {
    await expect(useCase.execute({ login: 'jose@example.com', password: 'wrong-password' })).rejects.toThrow(AuthenticationError);
  });

  it('still runs the password comparison when the user does not exist', async () => {
    const passwords = new FakePasswordHasher();
    const compare = jest.spyOn(passwords, 'compare');
    const loginUseCase = new LoginUseCase(users, passwords, new FakeRoleRepository(), refreshTokens, new FakeRefreshTokenService(), new FakeTokenService(), new FakeDomainEventPublisher());

    await expect(loginUseCase.execute({ login: 'ghost@example.com', password: 'password123' })).rejects.toThrow(AuthenticationError);

    expect(compare).toHaveBeenCalledTimes(1);
    expect(compare).toHaveBeenCalledWith('password123', expect.stringContaining('scrypt$'));
  });

  it('rejects unknown usernames with the same error as wrong passwords', async () => {
    await expect(useCase.execute({ login: 'ghost.silveira', password: 'password123' })).rejects.toThrow(AuthenticationError);
  });
});
