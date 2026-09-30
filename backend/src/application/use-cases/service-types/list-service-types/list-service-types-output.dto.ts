export interface ListServiceTypesOutputDto {
  serviceTypes: {
    id: string;
    description: string;
    unitValue: number;
    createdAt: Date;
    updatedAt: Date;
  }[];
}
