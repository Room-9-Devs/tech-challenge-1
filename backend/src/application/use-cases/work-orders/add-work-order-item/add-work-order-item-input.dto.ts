import { WorkOrderActorDto } from '../work-order-actor.dto';
export interface AddWorkOrderItemInputDto {
  id: string;
  serviceId?: string;
  productId?: string;
  quantity: number;
  actor: WorkOrderActorDto;
}
