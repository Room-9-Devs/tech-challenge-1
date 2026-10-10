import { WorkOrderActorDto } from '../work-order-actor.dto';
export interface FindWorkOrderInputDto {
  id: string;
  actor: WorkOrderActorDto;
}
