import { ApiProperty } from '@nestjs/swagger';

export class WorkOrderItemResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440010' })
  id: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    nullable: true,
  })
  serviceId: string | null;

  @ApiProperty({ example: null, nullable: true })
  productId: string | null;

  @ApiProperty({
    example: 1.5,
    description: 'Quantidade do catálogo congelada nesta OS.',
  })
  quantity: number;

  @ApiProperty({
    example: 120.5,
    description: 'Preço unitário congelado ao adicionar o item.',
  })
  unitPrice: number;

  @ApiProperty({ example: 180.75 })
  subtotal: number;

  @ApiProperty({ example: '2026-10-10T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-10T12:00:00.000Z' })
  updatedAt: Date;
}
