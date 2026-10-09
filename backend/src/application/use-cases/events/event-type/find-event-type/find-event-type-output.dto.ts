export interface FindEventTypeOutputDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  allowedEntityTypes: string[];
  createdAt: Date;
}
