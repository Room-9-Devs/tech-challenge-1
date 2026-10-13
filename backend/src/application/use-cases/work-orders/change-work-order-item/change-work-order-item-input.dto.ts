import { WorkOrderActorDto } from '../work-order-actor.dto';
export interface ChangeWorkOrderItemInputDto {
  id: string;
  itemId: string;
  quantity: number;
  actor: WorkOrderActorDto;
}
