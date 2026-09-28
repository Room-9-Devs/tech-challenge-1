import { CreateUserUseCase } from '@/application/use-cases/users/create-user/create-user.use-case';
import { FakeUserRepository } from '../../../../../fakes/fake-user.repository';
import { UserAlreadyExistsError } from '@/domain/errors/user-already-exists.error';
import { InvalidUserError } from '@/domain/errors/invalid-user.error';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let fakeRepository: FakeUserRepository;

  beforeEach(() => {
    fakeRepository = new FakeUserRepository();
    useCase = new CreateUserUseCase(fakeRepository);
  });

  it('should create a user with valid data', async () => {
    const result = await useCase.execute({
      name: 'John Doe',
      email: 'john@example.com',
    });

    expect(result.id).toBeDefined();
    expect(result.name).toBe('John Doe');
    expect(result.email).toBe('john@example.com');
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('should throw UserAlreadyExistsError when email already exists', async () => {
    await useCase.execute({
      name: 'John Doe',
      email: 'john@example.com',
    });

    await expect(
      useCase.execute({
        name: 'Jane Doe',
        email: 'john@example.com',
      }),
    ).rejects.toThrow(UserAlreadyExistsError);
  });

  it('should throw InvalidUserError when name is invalid', async () => {
    await expect(
      useCase.execute({
        name: '',
        email: 'john@example.com',
      }),
    ).rejects.toThrow(InvalidUserError);
  });

  it('should throw InvalidUserError when email is invalid', async () => {
    await expect(
      useCase.execute({
        name: 'John Doe',
        email: 'invalid-email',
      }),
    ).rejects.toThrow(InvalidUserError);
  });

  it('should persist user through repository', async () => {
    const result = await useCase.execute({
      name: 'John Doe',
      email: 'john@example.com',
    });

    const persistedUser = await fakeRepository.findById(result.id);

    expect(persistedUser).not.toBeNull();
    expect(persistedUser!.name).toBe('John Doe');
    expect(persistedUser!.email).toBe('john@example.com');
  });
});
