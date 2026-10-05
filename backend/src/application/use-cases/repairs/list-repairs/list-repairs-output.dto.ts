export interface ListRepairsOutputDto {
  repairs: {
    id: string;
    description: string;
    unitValue: number;
    createdAt: Date;
    updatedAt: Date;
  }[];
}
