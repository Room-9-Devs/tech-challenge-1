import { PaginatedOutput, PaginationQuery } from '@/shared/pagination/pagination.types';
import { Repair } from '../entities/repair.entity';

export interface RepairRepository {
  save(repair: Repair): Promise<Repair>;
  findById(id: string): Promise<Repair | null>;
  findAll(query?: PaginationQuery & { filters?: Record<string, string | number> }): Promise<PaginatedOutput<Repair>>;
  findByDescription(description: string): Promise<Repair | null>;
  delete(id: string): Promise<void>;
}
