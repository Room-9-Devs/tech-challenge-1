import { EventEntityType } from '@/domain/types/entity-reference.type';

export interface ListEventsByEntityIdInputDto {
  entityType: EventEntityType;
  entityId: string;
}
