export interface CreateEventTypeInputDto {
  code: string;
  name: string;
  description?: string | null;
  allowedEntityTypes?: string[];
}
