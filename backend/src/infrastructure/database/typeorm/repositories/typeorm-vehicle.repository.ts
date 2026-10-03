import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Vehicle } from '@/domain/entities/vehicle.entity';
import { VehicleRepository } from '@/domain/repositories/vehicle.repository';
import { VehicleOrmEntity } from '../entities/vehicle.orm-entity';
import { VehicleMapper } from '../mappers/vehicle.mapper';
import { VehicleAlreadyExistsError } from '@/domain/errors/vehicle-already-exists.error';
import { UserNotFoundError } from '@/domain/errors/user-not-found.error';

@Injectable()
export class TypeOrmVehicleRepository implements VehicleRepository {
  constructor(
    @InjectRepository(VehicleOrmEntity)
    private readonly repository: Repository<VehicleOrmEntity>,
  ) {}

  async save(vehicle: Vehicle): Promise<Vehicle> {
    const ormEntity = VehicleMapper.toPersistence(vehicle);
    try {
      const saved = await this.repository.save(ormEntity);
      return VehicleMapper.toDomain(saved);
    } catch (error) {
      if (error instanceof QueryFailedError) {
        const driver = error.driverError as {
          code?: string;
          constraint?: string;
        };
        if (driver.code === '23505')
          throw new VehicleAlreadyExistsError(vehicle.license_plate);
        if (
          driver.code === '23503' &&
          driver.constraint === 'FK_vehicles_user_id'
        ) {
          throw new UserNotFoundError(vehicle.user_id);
        }
      }
      throw error;
    }
  }

  async findById(id: string): Promise<Vehicle | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? VehicleMapper.toDomain(ormEntity) : null;
  }

  async findAll(): Promise<Vehicle[]> {
    const ormEntities = await this.repository.find();
    return ormEntities.map((entity) => VehicleMapper.toDomain(entity));
  }

  async findByLicensePlate(licensePlate: string): Promise<Vehicle | null> {
    const ormEntity = await this.repository.findOne({
      where: { licensePlate },
    });
    return ormEntity ? VehicleMapper.toDomain(ormEntity) : null;
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
