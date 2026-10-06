import { Vehicle } from '../entities/vehicle.entity';

export interface VehicleRepository {
  save(vehicle: Vehicle): Promise<Vehicle>;
  findById(id: string): Promise<Vehicle | null>;
  findAll(): Promise<Vehicle[]>;
  findByLicensePlate(licensePlate: string): Promise<Vehicle | null>;
  delete(id: string): Promise<void>;
}
