import { Vehicle } from '@/domain/entities/vehicle.entity';
import { VehicleOrmEntity } from '../entities/vehicle.orm-entity';

export class VehicleMapper {
  static toDomain(ormEntity: VehicleOrmEntity): Vehicle {
    return Vehicle.reconstitute({
      id: ormEntity.id,
      user_id: ormEntity.userId,
      license_plate: ormEntity.licensePlate,
      model: ormEntity.model,
      brand: ormEntity.brand,
      year: ormEntity.year,
      color: ormEntity.color,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(domainEntity: Vehicle): VehicleOrmEntity {
    const ormEntity = new VehicleOrmEntity();
    ormEntity.id = domainEntity.id;
    ormEntity.userId = domainEntity.user_id;
    ormEntity.licensePlate = domainEntity.license_plate;
    ormEntity.model = domainEntity.model;
    ormEntity.brand = domainEntity.brand;
    ormEntity.year = domainEntity.year;
    ormEntity.color = domainEntity.color;
    ormEntity.createdAt = domainEntity.createdAt;
    ormEntity.updatedAt = domainEntity.updatedAt;
    return ormEntity;
  }
}
