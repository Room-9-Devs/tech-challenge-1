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

  it('should return paginated vehicles', async () => {
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

    expect(result.data).toHaveLength(1);
    expect(result.data[0].license_plate).toBe('ABC1234');
    expect(result.meta).toEqual({
      page: 1,
      limit: 10,
      totalItems: 1,
      totalPages: 1,
    });
  });

  it('should return an empty paginated list when no vehicles exist', async () => {
    await expect(useCase.execute()).resolves.toEqual({
      data: [],
      meta: { page: 1, limit: 10, totalItems: 0, totalPages: 1 },
    });
  });
});
