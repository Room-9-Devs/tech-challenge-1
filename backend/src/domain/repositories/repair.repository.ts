import { Repair } from '../entities/repair.entity';

export interface RepairRepository {
  save(repair: Repair): Promise<Repair>;
  findById(id: string): Promise<Repair | null>;
  findAll(): Promise<Repair[]>;
  findByDescription(description: string): Promise<Repair | null>;
  delete(id: string): Promise<void>;
}
