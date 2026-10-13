import { PaginatedOutput, PaginationQuery } from '@/shared/pagination/pagination.types';
import { WorkOrder } from '../entities/work-order.entity';

export interface WorkOrderQuery extends PaginationQuery {
  search?: string;
  clientId?: string;
  filters?: Record<string, string | number>;
}

export interface WorkOrderRepository {
  save(workOrder: WorkOrder): Promise<WorkOrder>;
  findById(id: string): Promise<WorkOrder | null>;
  findAll(query: WorkOrderQuery): Promise<PaginatedOutput<WorkOrder>>;
  deleteItem(workOrderId: string, itemId: string): Promise<void>;
}

export const WORK_ORDER_REPOSITORY = Symbol('WORK_ORDER_REPOSITORY');
