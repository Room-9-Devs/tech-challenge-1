import { WorkOrderActorDto } from '@/application/use-cases/work-orders/work-order-actor.dto';

export interface GetWorkOrderStatsDetailInputDto {
  id: string;
  actor: WorkOrderActorDto;
}
