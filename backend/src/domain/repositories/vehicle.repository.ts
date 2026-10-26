import { Vehicle } from '../entities/vehicle.entity';
import {
  PaginatedOutput,
  PaginationQuery,
} from '@/shared/pagination/pagination.types';

export interface VehicleRepository {
  save(vehicle: Vehicle): Promise<Vehicle>;
  findById(id: string): Promise<Vehicle | null>;
  findAll(
    query?: PaginationQuery & { filters?: Record<string, string | number> },
  ): Promise<PaginatedOutput<Vehicle>>;
  findByLicensePlate(licensePlate: string): Promise<Vehicle | null>;
  delete(id: string): Promise<void>;
}
