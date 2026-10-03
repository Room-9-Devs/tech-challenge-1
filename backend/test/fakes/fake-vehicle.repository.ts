import { Vehicle } from '@/domain/entities/vehicle.entity';
import { VehicleRepository } from '@/domain/repositories/vehicle.repository';

export class FakeVehicleRepository implements VehicleRepository {
  private vehicles: Vehicle[] = [];

  async save(vehicle: Vehicle): Promise<Vehicle> {
    const existingIndex = this.vehicles.findIndex(
      (storedVehicle) => storedVehicle.id === vehicle.id,
    );

    if (existingIndex >= 0) {
      this.vehicles[existingIndex] = vehicle;
    } else {
      this.vehicles.push(vehicle);
    }

    return vehicle;
  }

  async findById(id: string): Promise<Vehicle | null> {
    return this.vehicles.find((vehicle) => vehicle.id === id) ?? null;
  }

  async findAll(): Promise<Vehicle[]> {
    return [...this.vehicles];
  }

  async findByLicensePlate(licensePlate: string): Promise<Vehicle | null> {
    return (
      this.vehicles.find((vehicle) => vehicle.license_plate === licensePlate) ??
      null
    );
  }

  async delete(id: string): Promise<void> {
    this.vehicles = this.vehicles.filter((vehicle) => vehicle.id !== id);
  }
}
