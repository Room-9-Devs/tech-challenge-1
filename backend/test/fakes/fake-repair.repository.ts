import { Repair } from '@/domain/entities/repair.entity';
import { RepairRepository } from '@/domain/repositories/repair.repository';

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

  async findAll(): Promise<Repair[]> {
    return this.repairs
      .filter((item) => !item.deletedAt)
      .map((item) => item.repair);
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
