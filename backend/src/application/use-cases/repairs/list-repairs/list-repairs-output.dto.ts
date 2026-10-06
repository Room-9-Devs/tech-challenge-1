import { PaginatedOutput } from '@/shared/pagination/pagination.types';

export interface ListRepairsItemOutputDto {
  id: string;
  description: string;
  unitValue: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ListRepairsOutputDto = PaginatedOutput<ListRepairsItemOutputDto>;
