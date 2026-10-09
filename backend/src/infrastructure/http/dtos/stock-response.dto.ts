import { ApiProperty } from '@nestjs/swagger';
import { ProductType, ProductUnit } from '@/domain/entities/product.entity';

export class StockProductResponseDto {
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
}

export class StockResponseDto {
  @ApiProperty({
    description: 'Identificador único do estoque',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'UUID do produto',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  productId: string;

  @ApiProperty({
    description: 'Produto do estoque',
    type: StockProductResponseDto,
  })
  product: StockProductResponseDto;

  @ApiProperty({
    description: 'Quantidade total em estoque, incluindo a reservada',
    example: 50,
  })
  quantity: number;

  @ApiProperty({
    description: 'Quantidade reservada para ordens de serviço',
    example: 5,
  })
  reserved: number;

  @ApiProperty({
    description: 'Quantidade disponível para saída (quantidade - reservada)',
    example: 45,
  })
  available: number;

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
