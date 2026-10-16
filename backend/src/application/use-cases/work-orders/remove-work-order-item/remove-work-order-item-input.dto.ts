import { WorkOrderActorDto } from '../work-order-actor.dto';
export interface RemoveWorkOrderItemInputDto {
  id: string;
  itemId: string;
  actor: WorkOrderActorDto;
}
