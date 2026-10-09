import { LogoutUseCase } from '@/application/use-cases/auth/logout.use-case';
import { FakeRefreshTokenRepository } from '../../../../fakes/fake-refresh-token.repository';
import { FakeRefreshTokenService } from '../../../../fakes/fake-token-services';
import { FakeDomainEventPublisher } from '../../../../fakes/fake-domain-event-publisher';
import { FakeUserRepository } from '../../../../fakes/fake-user.repository';
import { makeUser } from '../../../../fakes/user-fixture';

describe('LogoutUseCase', () => {
  it('revokes the current refresh token', async () => {
    const tokens = new FakeRefreshTokenRepository();
    const users = new FakeUserRepository();
    await users.save(makeUser());
    await tokens.save({ userId: 'user-1', tokenHash: 'hash:refresh-1', expiresAt: new Date(Date.now() + 60_000), revokedAt: null });
    await new LogoutUseCase(tokens, new FakeRefreshTokenService(), new FakeDomainEventPublisher(), users).execute('refresh-1');

    expect(tokens.records[0].revokedAt).toBeInstanceOf(Date);
  });

  it('is idempotent for an unknown token', async () => {
    const tokens = new FakeRefreshTokenRepository();
    const users = new FakeUserRepository();
    await expect(new LogoutUseCase(tokens, new FakeRefreshTokenService(), new FakeDomainEventPublisher(), users).execute('unknown')).resolves.toBeUndefined();
  });
});
