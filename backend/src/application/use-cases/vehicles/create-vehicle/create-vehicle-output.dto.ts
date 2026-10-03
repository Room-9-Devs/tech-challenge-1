export interface CreateVehicleOutputDto {
  id: string;
  user_id: string;
  license_plate: string;
  model: string;
  brand: string;
  year: number;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}
