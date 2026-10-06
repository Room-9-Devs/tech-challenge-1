import { ListVehiclesUseCase } from '@/application/use-cases/vehicles/list-vehicles/list-vehicles.use-case';
import { Vehicle } from '@/domain/entities/vehicle.entity';
import { FakeVehicleRepository } from '../../../../../fakes/fake-vehicle.repository';

describe('ListVehiclesUseCase', () => {
  let useCase: ListVehiclesUseCase;
  let fakeRepository: FakeVehicleRepository;

  beforeEach(() => {
    fakeRepository = new FakeVehicleRepository();
    useCase = new ListVehiclesUseCase(fakeRepository);
  });

  it('should return all vehicles', async () => {
    await fakeRepository.save(
      Vehicle.create({
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        license_plate: 'ABC1234',
        model: 'Corolla',
        brand: 'Toyota',
        year: 2022,
        color: 'Black',
      }),
    );

    const result = await useCase.execute();

    expect(result.vehicles).toHaveLength(1);
    expect(result.vehicles[0].license_plate).toBe('ABC1234');
  });

  it('should return an empty list when no vehicles exist', async () => {
    await expect(useCase.execute()).resolves.toEqual({ vehicles: [] });
  });
});
