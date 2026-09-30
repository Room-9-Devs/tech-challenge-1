import { ApiProperty } from '@nestjs/swagger';
import { ItemType, ItemUnit } from '@/domain/entities/item.entity';

export class ItemResponseDto {
  @ApiProperty({
    description: 'Item unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Item SKU',
    example: 'OLEO-5W30-1L',
  })
  sku: string;

  @ApiProperty({
    description: 'Item name',
    example: 'Óleo 5W30 sintético',
  })
  name: string;

  @ApiProperty({
    description: 'Item description',
    example: 'Óleo lubrificante sintético para motores a gasolina',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Item type',
    enum: ItemType,
    example: ItemType.CONSUMABLE,
  })
  itemType: ItemType;

  @ApiProperty({
    description: 'Item unit of measure',
    enum: ItemUnit,
    example: ItemUnit.LITER,
  })
  unit: ItemUnit;

  @ApiProperty({
    description: 'Item cost',
    example: 35.9,
  })
  cost: number;

  @ApiProperty({
    description: 'Item sale price',
    example: 59.9,
  })
  salePrice: number;

  @ApiProperty({
    description: 'Whether the item is active',
    example: true,
  })
  active: boolean;

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
