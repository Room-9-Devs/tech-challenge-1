import { UpdateUserUseCase } from '@/application/use-cases/users/update-user/update-user.use-case';
import { UserNotFoundError } from '@/domain/errors/user-not-found.error';
import { UserAlreadyExistsError } from '@/domain/errors/user-already-exists.error';
import { FakeUserRepository } from '../../../../../fakes/fake-user.repository';
import { FakeProfileRepository } from '../../../../../fakes/fake-profile.repository';
import { FakeRoleRepository } from '../../../../../fakes/fake-role.repository';
import { makeUser } from '../../../../../fakes/user-fixture';
import {
  DomainEventPublisher,
} from '@/application/ports/domain-event-publisher.port';

describe('UpdateUserUseCase', () => {
  const makeUseCase = () => {
    const users = new FakeUserRepository();
    const profiles = new FakeProfileRepository();
    const eventPublisher = {
      publish: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<DomainEventPublisher>;
    const roleRepository = new FakeRoleRepository();
    const useCase = new UpdateUserUseCase(users, profiles, roleRepository, eventPublisher);
    return { users, profiles, eventPublisher, useCase };
  };

  it('updates username, email and profile data', async () => {
    const { users, profiles, eventPublisher, useCase } = makeUseCase();
    const profile = await profiles.createEmployee({
      id: 'profile-1',
      name: 'José Silveira',
      documentType: 'CPF',
      document: '12345678901',
      jobTitle: 'Mecânico',
      phone: '11999999999',
    });
    await users.save(makeUser({ id: 'user-1', entityId: profile.id }));

    const result = await useCase.execute({
      id: 'user-1',
      username: 'jose.atualizado',
      profile: { name: 'José Atualizado', phone: '11988887777', jobTitle: 'Pintor' },
    });

    expect(result.username).toBe('jose.atualizado');
    expect(result.profile).toMatchObject({
      name: 'José Atualizado',
      phone: '(11) 98888-7777',
    });
    expect(existing(users, 'user-1').username).toBe('jose.atualizado');
    expect((await profiles.findById('employee', 'profile-1'))?.name).toBe('José Atualizado');

    expect(eventPublisher.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'user.updated',
        entityId: 'user-1',
      }),
    );
  });

  it('rejects update when the user does not exist', async () => {
    const { useCase } = makeUseCase();

    await expect(
      useCase.execute({ id: 'missing', username: 'novo' }),
    ).rejects.toThrow(UserNotFoundError);
  });

  it('rejects username already taken by another active user', async () => {
    const { users, profiles, useCase } = makeUseCase();
    const profile = await profiles.createClient({
      name: 'Outro',
      documentType: 'CPF',
      document: '47169572549',
      phone: '11999999999',
    });
    await users.save(makeUser({ id: 'user-1', username: 'joao', entityId: profile.id }));
    await users.save(
      makeUser({ id: 'user-2', username: 'maria', entityId: 'profile-2' }),
    );

    await expect(
      useCase.execute({ id: 'user-2', username: 'joao' }),
    ).rejects.toThrow(UserAlreadyExistsError);
  });

  it('rejects email already taken by another active user', async () => {
    const { users, useCase } = makeUseCase();
    await users.save(makeUser({ id: 'user-1', email: 'joao@example.com' }));
    await users.save(
      makeUser({ id: 'user-2', email: 'maria@example.com', username: 'maria' }),
    );

    await expect(
      useCase.execute({ id: 'user-2', email: 'joao@example.com' }),
    ).rejects.toThrow(UserAlreadyExistsError);
  });

  it('keeps the same username/email when they are unchanged', async () => {
    const { users, useCase } = makeUseCase();
    await users.save(makeUser({ id: 'user-1', username: 'joao' }));

    const result = await useCase.execute({
      id: 'user-1',
      username: 'joao',
      email: 'jose@example.com',
    });

    expect(result.username).toBe('joao');
  });

  it('ignores jobTitle for client profiles', async () => {
    const { users, profiles, useCase } = makeUseCase();
    const profile = await profiles.createClient({
      name: 'Cliente',
      documentType: 'CPF',
      document: '53046353547',
      phone: '11999999999',
    });
    await users.save(
      makeUser({ id: 'user-1', entityType: 'client', entityId: profile.id }),
    );

    await useCase.execute({
      id: 'user-1',
      profile: { name: 'Cliente Novo', jobTitle: 'Mecânico' },
    });

    const updated = await profiles.findById('client', profile.id);
    expect(updated?.name).toBe('Cliente Novo');
    expect(updated?.jobTitle).toBeUndefined();
  });
});

function existing(users: FakeUserRepository, id: string) {
  return users.snapshot().find((user) => user.id === id)!;
}
