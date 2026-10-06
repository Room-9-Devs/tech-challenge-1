import { LogoutUseCase } from '@/application/use-cases/auth/logout.use-case';
import { FakeRefreshTokenRepository } from '../../../../fakes/fake-refresh-token.repository';
import { FakeRefreshTokenService } from '../../../../fakes/fake-token-services';

describe('LogoutUseCase', () => {
  it('revokes the current refresh token', async () => {
    const tokens = new FakeRefreshTokenRepository();
    await tokens.save({ userId: 'user-1', tokenHash: 'hash:refresh-1', expiresAt: new Date(Date.now() + 60_000), revokedAt: null });
    await new LogoutUseCase(tokens, new FakeRefreshTokenService()).execute('refresh-1');

    expect(tokens.records[0].revokedAt).toBeInstanceOf(Date);
  });

  it('is idempotent for an unknown token', async () => {
    const tokens = new FakeRefreshTokenRepository();
    await expect(new LogoutUseCase(tokens, new FakeRefreshTokenService()).execute('unknown')).resolves.toBeUndefined();
  });
});
