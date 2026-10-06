import { FindVehicleUseCase } from '@/application/use-cases/vehicles/find-vehicle/find-vehicle.use-case';
import { Vehicle } from '@/domain/entities/vehicle.entity';
import { VehicleNotFoundError } from '@/domain/errors/vehicle-not-found.error';
import { FakeVehicleRepository } from '../../../../../fakes/fake-vehicle.repository';

describe('FindVehicleUseCase', () => {
  let useCase: FindVehicleUseCase;
  let fakeRepository: FakeVehicleRepository;

  beforeEach(() => {
    fakeRepository = new FakeVehicleRepository();
    useCase = new FindVehicleUseCase(fakeRepository);
  });

  it('should return an existing vehicle', async () => {
    const vehicle = Vehicle.create({
      user_id: '550e8400-e29b-41d4-a716-446655440000',
      license_plate: 'ABC1D23',
      model: 'Corolla',
      brand: 'Toyota',
      year: 2022,
      color: 'Black',
    });
    await fakeRepository.save(vehicle);

    const result = await useCase.execute({ id: vehicle.id });

    expect(result.id).toBe(vehicle.id);
    expect(result.license_plate).toBe('ABC1D23');
  });

  it('should throw when the vehicle does not exist', async () => {
    await expect(useCase.execute({ id: 'missing-id' })).rejects.toThrow(
      VehicleNotFoundError,
    );
  });
});
