export interface RecordEventOutputDto {
  id: string;
  eventTypeId: string;
  eventTypeCode: string;
  entityType: string;
  entityId: string;
  note: string | null;
  metadata: Record<string, unknown> | null;
  createdBy: string | null;
  createdAt: Date;
}
