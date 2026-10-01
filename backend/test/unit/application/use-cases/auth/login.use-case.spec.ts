import { LoginUseCase } from '@/application/use-cases/auth/login.use-case';
import { FakeUserRepository } from '../../../../fakes/fake-user.repository';
import { FakeRoleRepository } from '../../../../fakes/fake-role.repository';
import { FakeRefreshTokenRepository } from '../../../../fakes/fake-refresh-token.repository';
import { FakePasswordHasher } from '../../../../fakes/fake-password-hasher';
import { FakeRefreshTokenService, FakeTokenService } from '../../../../fakes/fake-token-services';
import { makeUser } from '../../../../fakes/user-fixture';
import { AuthenticationError } from '@/domain/errors/authentication.error';

describe('LoginUseCase', () => {
  let users: FakeUserRepository;
  let refreshTokens: FakeRefreshTokenRepository;
  let useCase: LoginUseCase;

  beforeEach(async () => {
    users = new FakeUserRepository();
    await users.save(makeUser({ password: 'hash:password123', roleId: 'role-staff' }));
    refreshTokens = new FakeRefreshTokenRepository();
    useCase = new LoginUseCase(users, new FakePasswordHasher(), new FakeRoleRepository(), refreshTokens, new FakeRefreshTokenService(), new FakeTokenService());
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
});
