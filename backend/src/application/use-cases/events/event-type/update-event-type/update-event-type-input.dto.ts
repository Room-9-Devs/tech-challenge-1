export interface UpdateEventTypeInputDto {
  id: string;
  name?: string;
  description?: string | null;
  allowedEntityTypes?: string[];
}
