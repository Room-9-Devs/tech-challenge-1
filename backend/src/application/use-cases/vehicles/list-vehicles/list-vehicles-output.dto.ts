import { PaginatedOutput } from '@/shared/pagination/pagination.types';

export interface ListVehiclesItemOutputDto {
  id: string;
  user_id: string | null;
  license_plate: string;
  model: string;
  brand: string;
  year: number;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ListVehiclesOutputDto = PaginatedOutput<ListVehiclesItemOutputDto>;
