export interface WorkOrderActorDto {
  id: string;
  username?: string;
  entityType: 'client' | 'employee';
}
