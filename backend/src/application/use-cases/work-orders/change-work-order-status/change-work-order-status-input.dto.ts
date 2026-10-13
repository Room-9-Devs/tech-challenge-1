import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import { WorkOrderActorDto } from '../work-order-actor.dto';
export interface ChangeWorkOrderStatusInputDto {
  id: string;
  status: WorkOrderStatus;
  note: string;
  actor: WorkOrderActorDto;
}
