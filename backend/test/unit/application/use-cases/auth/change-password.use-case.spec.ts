import { ChangePasswordUseCase } from '@/application/use-cases/auth/change-password.use-case';
import { FakeUserRepository } from '../../../../fakes/fake-user.repository';
import { FakePasswordHasher } from '../../../../fakes/fake-password-hasher';
import { FakeRefreshTokenRepository } from '../../../../fakes/fake-refresh-token.repository';
import { makeUser } from '../../../../fakes/user-fixture';
import { AuthenticationError } from '@/domain/errors/authentication.error';

describe('ChangePasswordUseCase', () => {
  it('changes the password and revokes all refresh sessions', async () => {
    const users = new FakeUserRepository();
    await users.save(makeUser({ password: 'hash:old-password' }));
    const sessions = new FakeRefreshTokenRepository();
    await sessions.save({ userId: 'user-1', tokenHash: 'hash:one', expiresAt: new Date(Date.now() + 60_000), revokedAt: null });
    await new ChangePasswordUseCase(users, new FakePasswordHasher(), sessions).execute('user-1', 'old-password', 'new-password');

    expect((await users.findById('user-1'))?.password).toBe('hash:new-password');
    expect(sessions.records[0].revokedAt).toBeInstanceOf(Date);
  });

  it('rejects an incorrect current password', async () => {
    const users = new FakeUserRepository();
    await users.save(makeUser({ password: 'hash:old-password' }));
    await expect(new ChangePasswordUseCase(users, new FakePasswordHasher(), new FakeRefreshTokenRepository()).execute('user-1', 'wrong', 'new-password')).rejects.toThrow(AuthenticationError);
  });
});
