import { ApiProperty } from '@nestjs/swagger';

export class RepairResponseDto {
  @ApiProperty({
    description: 'Identificador único do tipo de reparo/serviço',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Descrição do tipo de reparo/serviço',
    example: 'Troca de óleo',
  })
  description: string;

  @ApiProperty({
    description: 'Valor unitário do reparo/serviço',
    example: 120.5,
  })
  unitValue: number;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
