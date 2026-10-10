import { WorkOrder } from '@/domain/entities/work-order.entity';
import { Vehicle } from '@/domain/entities/vehicle.entity';
import { User } from '@/domain/entities/user.entity';
import { ProfileRecord } from '@/application/ports/profile.repository';
export interface FindWorkOrderOutputDto {
  order: WorkOrder;
  vehicle: Vehicle | null;
  client: User | null;
  profile: ProfileRecord | null;
}
