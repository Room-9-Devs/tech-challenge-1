export interface FindVehicleOutputDto {
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
