import { ApiProperty } from '@nestjs/swagger';
import { ProductType, ProductUnit } from '@/domain/entities/product.entity';

export class ProductResponseDto {
  @ApiProperty({
    description: 'Identificador único do produto',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'SKU do produto',
    example: 'OLEO-5W30-1L',
  })
  sku: string;

  @ApiProperty({
    description: 'Nome do produto',
    example: 'Óleo 5W30 sintético',
  })
  name: string;

  @ApiProperty({
    description: 'Descrição do produto',
    example: 'Óleo lubrificante sintético para motores a gasolina',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Tipo do produto',
    enum: ProductType,
    example: ProductType.CONSUMABLE,
  })
  productType: ProductType;

  @ApiProperty({
    description: 'Unidade de medida do produto',
    enum: ProductUnit,
    example: ProductUnit.LITER,
  })
  unit: ProductUnit;

  @ApiProperty({
    description: 'Custo do produto',
    example: 35.9,
  })
  cost: number;

  @ApiProperty({
    description: 'Preço de venda do produto',
    example: 59.9,
  })
  salePrice: number;

  @ApiProperty({
    description: 'Indica se o produto está ativo',
    example: true,
  })
  active: boolean;

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
