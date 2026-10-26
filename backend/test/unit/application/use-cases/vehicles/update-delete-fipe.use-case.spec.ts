import { Vehicle } from '@/domain/entities/vehicle.entity';
import { FakeVehicleRepository } from '../../../../fakes/fake-vehicle.repository';
import { UpdateVehicleUseCase } from '@/application/use-cases/vehicles/update-vehicle.use-case';
import { DeleteVehicleUseCase } from '@/application/use-cases/vehicles/delete-vehicle.use-case';
import { GetFipeDataUseCase, InvalidFipeCodeError } from '@/application/use-cases/vehicles/get-fipe-data.use-case';
import { VehicleAlreadyExistsError } from '@/domain/errors/vehicle-already-exists.error';
import { VehicleNotFoundError } from '@/domain/errors/vehicle-not-found.error';
import { FakeDomainEventPublisher } from '../../../../fakes/fake-domain-event-publisher';

const base = { user_id: 'user-1', license_plate: 'ABC1234', model: 'Corolla', brand: 'Toyota', year: 2022, color: 'Black' };

describe('Vehicle update/delete and FIPE', () => {
  let repo: FakeVehicleRepository;
  beforeEach(() => { repo = new FakeVehicleRepository(); });

  it('replaces details and keeps owner and creation time', async () => {
    const vehicle = await repo.save(Vehicle.create(base));
    const result = await new UpdateVehicleUseCase(repo, new FakeDomainEventPublisher()).execute({ id: vehicle.id, license_plate: 'ABC1D23', model: 'Civic', brand: 'Honda', year: 2023, color: 'White' });
    expect(result).toMatchObject({ id: vehicle.id, user_id: 'user-1', license_plate: 'ABC1D23', model: 'Civic' });
    expect(result.createdAt).toEqual(vehicle.createdAt);
  });

  it('rejects duplicate plates and missing vehicles', async () => {
    const first = await repo.save(Vehicle.create(base));
    await repo.save(Vehicle.create({ ...base, license_plate: 'ABC1D23' }));
    const update = new UpdateVehicleUseCase(repo, new FakeDomainEventPublisher());
    await expect(update.execute({ id: first.id, ...base, license_plate: 'ABC1D23' })).rejects.toThrow(VehicleAlreadyExistsError);
    await expect(update.execute({ id: 'missing', ...base })).rejects.toThrow(VehicleNotFoundError);
  });

  it('deletes an existing vehicle and rejects an absent one', async () => {
    const vehicle = await repo.save(Vehicle.create(base));
    const remove = new DeleteVehicleUseCase(repo, new FakeDomainEventPublisher());
    await remove.execute(vehicle.id);
    expect(await repo.findById(vehicle.id)).toBeNull();
    await expect(remove.execute(vehicle.id)).rejects.toThrow(VehicleNotFoundError);
  });

  it('validates FIPE codes before calling the gateway', async () => {
    const gateway = { getPrices: jest.fn().mockResolvedValue([]) };
    const useCase = new GetFipeDataUseCase(gateway as never);
    await expect(useCase.execute('001004-9')).resolves.toEqual([]);
    await expect(useCase.execute('../bad')).rejects.toThrow(InvalidFipeCodeError);
    expect(gateway.getPrices).toHaveBeenCalledTimes(1);
  });
});
