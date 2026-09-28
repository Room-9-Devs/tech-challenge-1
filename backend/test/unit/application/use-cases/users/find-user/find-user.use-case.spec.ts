import { FindUserUseCase } from '@/application/use-cases/users/find-user/find-user.use-case';
import { FakeUserRepository } from '../../../../../fakes/fake-user.repository';
import { UserNotFoundError } from '@/domain/errors/user-not-found.error';
import { User } from '@/domain/entities/user.entity';

describe('FindUserUseCase', () => {
  let useCase: FindUserUseCase;
  let fakeRepository: FakeUserRepository;

  beforeEach(() => {
    fakeRepository = new FakeUserRepository();
    useCase = new FindUserUseCase(fakeRepository);
  });

  it('should return user when user exists', async () => {
    const user = User.create({
      name: 'John Doe',
      email: 'john@example.com',
    });

    await fakeRepository.save(user);

    const result = await useCase.execute({ id: user.id });

    expect(result.id).toBe(user.id);
    expect(result.name).toBe('John Doe');
    expect(result.email).toBe('john@example.com');
  });

  it('should throw UserNotFoundError when user does not exist', async () => {
    await expect(useCase.execute({ id: 'non-existent-id' })).rejects.toThrow(
      UserNotFoundError,
    );
  });
});
