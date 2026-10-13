import { WorkOrderActorDto } from '../work-order-actor.dto';
export interface CreateWorkOrderInputDto {
  vehicleId: string;
  observations?: string | null;
  actor: WorkOrderActorDto;
}
