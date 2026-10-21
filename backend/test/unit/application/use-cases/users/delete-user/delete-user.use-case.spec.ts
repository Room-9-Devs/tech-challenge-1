import { DeleteUserUseCase } from '@/application/use-cases/users/delete-user/delete-user.use-case';
import { UserNotFoundError } from '@/domain/errors/user-not-found.error';
import { FakeUserRepository } from '../../../../../fakes/fake-user.repository';
import { makeUser } from '../../../../../fakes/user-fixture';
import {
  DomainEventPublisher,
} from '@/application/ports/domain-event-publisher.port';
import {
  RefreshTokenRepository,
} from '@/application/ports/refresh-token.repository';

describe('DeleteUserUseCase', () => {
  const makeUseCase = () => {
    const users = new FakeUserRepository();
    const refreshTokenRepository = {
      save: jest.fn(),
      findByHash: jest.fn(),
      findValidByHash: jest.fn(),
      revoke: jest.fn(),
      revokeIfActive: jest.fn(),
      revokeAllByUserId: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<RefreshTokenRepository>;
    const eventPublisher = {
      publish: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<DomainEventPublisher>;
    const useCase = new DeleteUserUseCase(
      users,
      refreshTokenRepository,
      eventPublisher,
    );
    return { users, refreshTokenRepository, eventPublisher, useCase };
  };

  it('soft deletes the user and revokes refresh tokens', async () => {
    const { users, refreshTokenRepository, eventPublisher, useCase } = makeUseCase();
    await users.save(makeUser({ id: 'user-1' }));

    await useCase.execute({ id: 'user-1', deletedBy: 'admin' });

    const deleted = users.snapshot().find((user) => user.id === 'user-1');
    expect(deleted?.deletedAt).toBeInstanceOf(Date);
    expect(deleted?.username).toBe('jose.silveira');
    expect(deleted?.email).toBe('jose@example.com');

    expect(refreshTokenRepository.revokeAllByUserId).toHaveBeenCalledWith('user-1');

    expect(eventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'user.deleted',
        entityId: 'user-1',
        createdBy: 'admin',
      }),
    );
  });

  it('rejects deletion when the user does not exist', async () => {
    const { useCase } = makeUseCase();

    await expect(useCase.execute({ id: 'missing' })).rejects.toThrow(UserNotFoundError);
  });

  it('rejects deletion of an already deleted user', async () => {
    const { users, refreshTokenRepository, eventPublisher, useCase } = makeUseCase();
    await users.save(makeUser({ id: 'user-1' }));

    await useCase.execute({ id: 'user-1' });

    await expect(useCase.execute({ id: 'user-1' })).rejects.toThrow(UserNotFoundError);
    expect(refreshTokenRepository.revokeAllByUserId).toHaveBeenCalledTimes(1);
    expect(eventPublisher.publish).toHaveBeenCalledTimes(1);
  });
});
