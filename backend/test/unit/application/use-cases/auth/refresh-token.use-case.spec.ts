import { RefreshTokenUseCase } from '@/application/use-cases/auth/refresh-token.use-case';
import { FakeUserRepository } from '../../../../fakes/fake-user.repository';
import { FakeRoleRepository } from '../../../../fakes/fake-role.repository';
import { FakeRefreshTokenRepository } from '../../../../fakes/fake-refresh-token.repository';
import { FakeRefreshTokenService, FakeTokenService } from '../../../../fakes/fake-token-services';
import { makeUser } from '../../../../fakes/user-fixture';
import { RefreshTokenInvalidError } from '@/domain/errors/refresh-token-invalid.error';

describe('RefreshTokenUseCase', () => {
  it('rotates a valid refresh token', async () => {
    const users = new FakeUserRepository();
    await users.save(makeUser({ roleId: 'role-staff' }));
    const tokens = new FakeRefreshTokenRepository();
    await tokens.save({ userId: 'user-1', tokenHash: 'hash:old-token', expiresAt: new Date(Date.now() + 60_000), revokedAt: null });
    const result = await new RefreshTokenUseCase(users, new FakeRoleRepository(), tokens, new FakeRefreshTokenService(), new FakeTokenService()).execute('old-token');

    expect(result.refreshToken).toBe('refresh-1');
    expect(tokens.records[0].revokedAt).toBeInstanceOf(Date);
    expect(tokens.records).toHaveLength(2);
  });

  it('rejects an invalid refresh token', async () => {
    const useCase = new RefreshTokenUseCase(new FakeUserRepository(), new FakeRoleRepository(), new FakeRefreshTokenRepository(), new FakeRefreshTokenService(), new FakeTokenService());
    await expect(useCase.execute('unknown')).rejects.toThrow(RefreshTokenInvalidError);
  });

  it('rejects a refresh token whose user no longer exists', async () => {
    const tokens = new FakeRefreshTokenRepository();
    await tokens.save({ userId: 'missing', tokenHash: 'hash:orphan', expiresAt: new Date(Date.now() + 60_000), revokedAt: null });
    const useCase = new RefreshTokenUseCase(new FakeUserRepository(), new FakeRoleRepository(), tokens, new FakeRefreshTokenService(), new FakeTokenService());
    await expect(useCase.execute('orphan')).rejects.toThrow(RefreshTokenInvalidError);
  });
});
