import { PaginatedOutput } from '@/shared/pagination/pagination.types';
import { WorkOrder } from '@/domain/entities/work-order.entity';
export type ListWorkOrdersOutputDto = PaginatedOutput<WorkOrder>;
