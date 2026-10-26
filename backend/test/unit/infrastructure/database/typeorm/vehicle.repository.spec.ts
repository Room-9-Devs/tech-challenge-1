import { QueryFailedError } from 'typeorm';
import { Vehicle } from '@/domain/entities/vehicle.entity';
import { VehicleMapper } from '@/infrastructure/database/typeorm/mappers/vehicle.mapper';
import { TypeOrmVehicleRepository } from '@/infrastructure/database/typeorm/repositories/typeorm-vehicle.repository';
import { VehicleAlreadyExistsError } from '@/domain/errors/vehicle-already-exists.error';
import { UserNotFoundError } from '@/domain/errors/user-not-found.error';

const vehicle = () =>
  Vehicle.create({
    user_id: '550e8400-e29b-41d4-a716-446655440000',
    license_plate: 'ABC-1234',
    model: 'Corolla',
    brand: 'Toyota',
    year: 2022,
    color: 'Black',
  });

describe('TypeOrmVehicleRepository', () => {
  it('maps the persisted vehicle and owner back to the domain', async () => {
    const input = vehicle();
    const persistence = VehicleMapper.toPersistence(input);
    const repo = { save: jest.fn().mockResolvedValue(persistence) };
    const result = await new TypeOrmVehicleRepository(repo as never).save(
      input,
    );
    expect(result.id).toBe(input.id);
    expect(result.user_id).toBe(input.user_id);
    expect(result.license_plate).toBe('ABC1234');
  });

  it('maps a plate conflict raised by PostgreSQL to 409', async () => {
    const failure = new QueryFailedError(
      'INSERT',
      [],
      Object.assign(new Error('duplicate'), { code: '23505' }),
    );
    const repo = { save: jest.fn().mockRejectedValue(failure) };
    await expect(
      new TypeOrmVehicleRepository(repo as never).save(vehicle()),
    ).rejects.toThrow(VehicleAlreadyExistsError);
  });

  it('maps an owner removed during creation to a not-found error', async () => {
    const failure = new QueryFailedError(
      'INSERT',
      [],
      Object.assign(new Error('foreign key'), {
        code: '23503',
        constraint: 'FK_vehicles_user_id',
      }),
    );
    const repo = { save: jest.fn().mockRejectedValue(failure) };
    await expect(
      new TypeOrmVehicleRepository(repo as never).save(vehicle()),
    ).rejects.toThrow(UserNotFoundError);
  });

  it('does not hide unrelated database errors', async () => {
    const failure = new Error('database unavailable');
    const repo = { save: jest.fn().mockRejectedValue(failure) };
    await expect(
      new TypeOrmVehicleRepository(repo as never).save(vehicle()),
    ).rejects.toBe(failure);
  });

  it('reconstitutes a legacy record without inventing an owner', () => {
    const persistence = VehicleMapper.toPersistence(vehicle());
    persistence.userId = null;
    expect(VehicleMapper.toDomain(persistence).user_id).toBeNull();
  });
});
