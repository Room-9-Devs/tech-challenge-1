import { ListUsersUseCase } from '@/application/use-cases/users/list-users/list-users.use-case';
import { FakeUserRepository } from '../../../../../fakes/fake-user.repository';
import { User } from '@/domain/entities/user.entity';

describe('ListUsersUseCase', () => {
  let useCase: ListUsersUseCase;
  let fakeRepository: FakeUserRepository;

  beforeEach(() => {
    fakeRepository = new FakeUserRepository();
    useCase = new ListUsersUseCase(fakeRepository);
  });

  it('should return list of users', async () => {
    const user1 = User.create({
      name: 'John Doe',
      email: 'john@example.com',
    });

    const user2 = User.create({
      name: 'Jane Doe',
      email: 'jane@example.com',
    });

    await fakeRepository.save(user1);
    await fakeRepository.save(user2);

    const result = await useCase.execute();

    expect(result.users).toHaveLength(2);
    expect(result.users[0].name).toBe('John Doe');
    expect(result.users[1].name).toBe('Jane Doe');
  });

  it('should return empty list when no users exist', async () => {
    const result = await useCase.execute();

    expect(result.users).toEqual([]);
  });
});
