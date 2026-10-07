import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Vehicle } from '@/domain/entities/vehicle.entity';
import { VehicleRepository } from '@/domain/repositories/vehicle.repository';
import { VehicleOrmEntity } from '../entities/vehicle.orm-entity';
import { VehicleMapper } from '../mappers/vehicle.mapper';
import { VehicleAlreadyExistsError } from '@/domain/errors/vehicle-already-exists.error';
import { UserNotFoundError } from '@/domain/errors/user-not-found.error';
import { applyPagination } from '@/shared/pagination/typeorm-pagination.helper';
import { PaginatedOutput, PaginationQuery } from '@/shared/pagination/pagination.types';

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

  async findAll(
    query?: PaginationQuery & { filters?: Record<string, string | number> },
  ): Promise<PaginatedOutput<Vehicle>> {
    const { filters, ...paginationQuery } = query ?? {
      page: 1,
      limit: 10,
    };

    const queryBuilder = this.repository.createQueryBuilder('vehicle');

    const allowedFilters = ['brand', 'model', 'year', 'color', 'userId'];

    if (filters) {
      for (const [key, rawValue] of Object.entries(filters)) {
        if (!allowedFilters.includes(key)) continue;

        const value =
          rawValue === 'true' ? true : rawValue === 'false' ? false : rawValue;
        const paramName = `filter_${key}`;
        queryBuilder.andWhere(`vehicle.${key} = :${paramName}`, {
          [paramName]: value,
        });
      }
    }

    applyPagination(queryBuilder, paginationQuery, {
      searchColumns: [
        'vehicle.licensePlate',
        'vehicle.model',
        'vehicle.brand',
        'vehicle.color',
      ],
      alias: 'vehicle',
      allowedSortColumns: [
        'licensePlate',
        'model',
        'brand',
        'year',
        'color',
        'createdAt',
        'updatedAt',
      ],
    });

    const [ormEntities, totalItems] = await queryBuilder.getManyAndCount();

    return {
      data: ormEntities.map((entity) => VehicleMapper.toDomain(entity)),
      meta: {
        page: paginationQuery.page,
        limit: paginationQuery.limit,
        totalItems,
        totalPages: Math.ceil(totalItems / paginationQuery.limit) || 1,
      },
    };
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
