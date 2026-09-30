import { ApiProperty } from '@nestjs/swagger';

export class ServiceTypeResponseDto {
  @ApiProperty({
    description: 'Service type unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Service type description',
    example: 'Troca de óleo',
  })
  description: string;

  @ApiProperty({
    description: 'Unit value of the service',
    example: 120.5,
  })
  unitValue: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
