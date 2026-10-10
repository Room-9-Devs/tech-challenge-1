import { WorkOrderQuery } from '@/domain/repositories/work-order.repository';
import { WorkOrderActorDto } from '../work-order-actor.dto';
export interface ListWorkOrdersInputDto {
  query: WorkOrderQuery;
  actor: WorkOrderActorDto;
}
