import { Vehicle } from '@/domain/entities/vehicle.entity';
import { InvalidVehicleError } from '@/domain/errors/invalid-vehicle.error';

const validVehicleProps = {
  user_id: '550e8400-e29b-41d4-a716-446655440000',
  license_plate: 'ABC-1234',
  model: 'Corolla',
  brand: 'Toyota',
  year: 2022,
  color: 'Black',
};

describe('Vehicle Entity', () => {
  it('should create a vehicle and normalize an old-format plate', () => {
    const vehicle = Vehicle.create(validVehicleProps);

    expect(vehicle).toBeInstanceOf(Vehicle);
    expect(vehicle.id).toBeDefined();
    expect(vehicle.license_plate).toBe('ABC1234');
  });

  it('should accept and normalize a Mercosur plate', () => {
    const vehicle = Vehicle.create({
      ...validVehicleProps,
      license_plate: 'abc1d23',
    });

    expect(vehicle.license_plate).toBe('ABC1D23');
  });

  it('should reject a malformed plate', () => {
    expect(() =>
      Vehicle.create({
        ...validVehicleProps,
        license_plate: 'A-B-C-1-2-3-4',
      }),
    ).toThrow(InvalidVehicleError);
  });

  it.each([
    ['model', { model: '' }],
    ['brand', { brand: '' }],
    ['color', { color: '' }],
    ['year', { year: 1800 }],
  ])('should reject an invalid %s', (_, invalidProps) => {
    expect(() =>
      Vehicle.create({ ...validVehicleProps, ...invalidProps }),
    ).toThrow(InvalidVehicleError);
  });

  it('should validate changes to vehicle data', () => {
    const vehicle = Vehicle.create(validVehicleProps);

    expect(() => vehicle.changeModel('')).toThrow(InvalidVehicleError);
    expect(() => vehicle.changeBrand('')).toThrow(InvalidVehicleError);
    expect(() => vehicle.changeYear(1800)).toThrow(InvalidVehicleError);
    expect(() => vehicle.changeColor('')).toThrow(InvalidVehicleError);
  });

  it('keeps legacy vehicles readable but requires an owner before updating', () => {
    const legacy = Vehicle.reconstitute({
      ...validVehicleProps,
      user_id: null,
    });
    expect(legacy.user_id).toBeNull();
    expect(() => legacy.updateDetails(validVehicleProps)).toThrow(
      InvalidVehicleError,
    );
    expect(() => Vehicle.create({ ...validVehicleProps, user_id: '' })).toThrow(
      InvalidVehicleError,
    );
  });
});
