import { WorkOrderActorDto } from '../work-order-actor.dto';
export interface ConfirmWorkOrderPaymentInputDto {
  id: string;
  note?: string;
  actor: WorkOrderActorDto;
}
