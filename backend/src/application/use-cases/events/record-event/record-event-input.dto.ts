export interface RecordEventInputDto {
  eventTypeCode: string;
  entityType: string;
  entityId: string;
  note?: string | null;
  metadata?: Record<string, unknown> | null;
  createdBy?: string | null;
}
