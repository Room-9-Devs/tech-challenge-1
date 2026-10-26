import { Vehicle } from '@/domain/entities/vehicle.entity';
import { VehicleRepository } from '@/domain/repositories/vehicle.repository';
import {
  PaginatedOutput,
  PaginationQuery,
} from '@/shared/pagination/pagination.types';

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

  async findAll(
    query?: PaginationQuery & { filters?: Record<string, string | number> },
  ): Promise<PaginatedOutput<Vehicle>> {
    const { filters, ...paginationQuery } = query ?? {
      page: 1,
      limit: 10,
    };

    let data = [...this.vehicles];

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        data = data.filter((vehicle) => {
          if (key === 'brand') return vehicle.brand === value;
          if (key === 'model') return vehicle.model === value;
          if (key === 'color') return vehicle.color === value;
          if (key === 'year') return vehicle.year === Number(value);
          if (key === 'userId') return vehicle.user_id === value;
          return true;
        });
      }
    }

    if (paginationQuery.search) {
      const search = paginationQuery.search.toLowerCase();
      data = data.filter(
        (vehicle) =>
          vehicle.license_plate.toLowerCase().includes(search) ||
          vehicle.model.toLowerCase().includes(search) ||
          vehicle.brand.toLowerCase().includes(search) ||
          vehicle.color.toLowerCase().includes(search),
      );
    }

    if (paginationQuery.sort && paginationQuery.sort.length > 0) {
      const { field, order } = paginationQuery.sort[0];
      data.sort((a, b) => {
        const aValue = a[field as keyof Vehicle];
        const bValue = b[field as keyof Vehicle];
        if (aValue == null || bValue == null) return 0;
        if (aValue < bValue) return order === 'asc' ? -1 : 1;
        if (aValue > bValue) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    const totalItems = data.length;
    const page = paginationQuery.page ?? 1;
    const limit = paginationQuery.limit ?? 10;
    const start = (page - 1) * limit;
    data = data.slice(start, start + limit);

    return {
      data,
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit) || 1,
      },
    };
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
