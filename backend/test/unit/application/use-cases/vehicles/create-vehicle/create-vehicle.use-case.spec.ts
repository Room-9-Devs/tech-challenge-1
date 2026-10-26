import { CreateVehicleUseCase } from '@/application/use-cases/vehicles/create-vehicle/create-vehicle.use-case';
import { InvalidVehicleError } from '@/domain/errors/invalid-vehicle.error';
import { VehicleAlreadyExistsError } from '@/domain/errors/vehicle-already-exists.error';
import { FakeVehicleRepository } from '../../../../../fakes/fake-vehicle.repository';
import { FakeUserRepository } from '../../../../../fakes/fake-user.repository';
import { FakeDomainEventPublisher } from '../../../../../fakes/fake-domain-event-publisher';
import { UserNotFoundError } from '@/domain/errors/user-not-found.error';
import { makeUser } from '../../../../../fakes/user-fixture';

const userId = '550e8400-e29b-41d4-a716-446655440000';

const input = {
  user_id: userId,
  license_plate: 'ABC-1234',
  model: 'Corolla',
  brand: 'Toyota',
  year: 2022,
  color: 'Black',
};

describe('CreateVehicleUseCase', () => {
  let useCase: CreateVehicleUseCase;
  let fakeRepository: FakeVehicleRepository;
  let fakeUserRepository: FakeUserRepository;

  beforeEach(async () => {
    fakeRepository = new FakeVehicleRepository();
    fakeUserRepository = new FakeUserRepository();
    await fakeUserRepository.save(
      makeUser({
        id: userId,
        email: 'john@example.com',
        entityType: 'client',
        entityId: 'client-1',
      }),
    );
    useCase = new CreateVehicleUseCase(fakeRepository, fakeUserRepository, new FakeDomainEventPublisher());
  });

  it('should create and persist a vehicle', async () => {
    const result = await useCase.execute(input);

    expect(result.id).toBeDefined();
    expect(result.user_id).toBe(userId);
    expect(result.license_plate).toBe('ABC1234');
    await expect(fakeRepository.findById(result.id)).resolves.not.toBeNull();
  });

  it('should detect duplicate plates after normalization', async () => {
    await useCase.execute(input);

    await expect(
      useCase.execute({ ...input, license_plate: 'abc1234' }),
    ).rejects.toThrow(VehicleAlreadyExistsError);
  });

  it('should reject invalid vehicle data', async () => {
    await expect(
      useCase.execute({ ...input, license_plate: 'INVALID' }),
    ).rejects.toThrow(InvalidVehicleError);
  });

  it('should throw UserNotFoundError when owner does not exist', async () => {
    await expect(
      useCase.execute({
        ...input,
        user_id: 'c56a4180-65aa-42ec-a945-5fd21dec0538',
      }),
    ).rejects.toThrow(UserNotFoundError);
  });
});
