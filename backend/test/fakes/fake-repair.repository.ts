import { Repair } from '@/domain/entities/repair.entity';
import { RepairRepository } from '@/domain/repositories/repair.repository';
import { PaginatedOutput, PaginationQuery } from '@/shared/pagination/pagination.types';
import { compareValues } from '../helpers/compare-values';

interface StoredRepair {
  repair: Repair;
  deletedAt: Date | null;
}

export class FakeRepairRepository implements RepairRepository {
  private repairs: StoredRepair[] = [];

  async save(repair: Repair): Promise<Repair> {
    const existingIndex = this.repairs.findIndex(
      (item) => item.repair.id === repair.id && !item.deletedAt,
    );

    if (existingIndex >= 0) {
      this.repairs[existingIndex].repair = repair;
    } else {
      this.repairs.push({ repair, deletedAt: null });
    }

    return repair;
  }

  async findById(id: string): Promise<Repair | null> {
    const item = this.repairs.find(
      (item) => item.repair.id === id && !item.deletedAt,
    );
    return item ? item.repair : null;
  }

  async findAll(
    query?: PaginationQuery & { filters?: Record<string, string | number> },
  ): Promise<PaginatedOutput<Repair>> {
    const page = query?.page ?? 1;
    const limit = query?.limit ?? 10;
    const search = query?.search?.trim().toLowerCase();
    const filters = query?.filters ?? {};

    const allowedFilters = ['description', 'unitValue'];

    let data = this.repairs
      .filter((item) => !item.deletedAt)
      .map((item) => item.repair);

    for (const [key, value] of Object.entries(filters)) {
      if (!allowedFilters.includes(key)) continue;

      data = data.filter((repair) => {
        const repairValue = (repair as unknown as Record<string, unknown>)[key];
        return repairValue === value;
      });
    }

    if (search) {
      const terms = search.split(/\s+/);
      data = data.filter((repair) =>
        terms.some((term) =>
          repair.description.toLowerCase().includes(term),
        ),
      );
    }

    const allowedSortColumns = ['description', 'unitValue', 'createdAt', 'updatedAt'];

    if (query?.sort && query.sort.length > 0) {
      data.sort((a, b) => {
        for (const { field, order } of query.sort!) {
          if (!allowedSortColumns.includes(field)) continue;

          const valueA = (a as unknown as Record<string, unknown>)[field];
          const valueB = (b as unknown as Record<string, unknown>)[field];

          if (valueA == null || valueB == null) continue;

          const comparison = compareValues(valueA, valueB);
          if (comparison !== 0) {
            return order === 'asc' ? comparison : -comparison;
          }
        }
        return 0;
      });
    }

    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / limit) || 1;
    const startIndex = (page - 1) * limit;
    data = data.slice(startIndex, startIndex + limit);

    return {
      data,
      meta: { page, limit, totalItems, totalPages },
    };
  }

  async findByDescription(description: string): Promise<Repair | null> {
    const item = this.repairs.find(
      (item) =>
        item.repair.description === description && !item.deletedAt,
    );
    return item ? item.repair : null;
  }

  async delete(id: string): Promise<void> {
    const item = this.repairs.find(
      (item) => item.repair.id === id && !item.deletedAt,
    );

    if (item) {
      item.deletedAt = new Date();
    }
  }

  clear(): void {
    this.repairs = [];
  }
}