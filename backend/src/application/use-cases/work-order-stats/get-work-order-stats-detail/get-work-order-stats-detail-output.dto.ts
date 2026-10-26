import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import {
  WorkOrderStageView,
  WorkOrderTotalView,
  WorkOrderCurrentStatusView,
} from './stages';

export interface GetWorkOrderStatsDetailOutputDto {
  id: string;
  number: string;
  status: WorkOrderStatus;
  createdAt: Date;
  stages: WorkOrderStageView[];
  total: WorkOrderTotalView;
  currentStatus: WorkOrderCurrentStatusView;
}
