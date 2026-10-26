import { ApiProperty } from '@nestjs/swagger';
import { StockMovementType } from '@/domain/entities/stock-movement.entity';
import { ApiLinksProperty } from '../hateoas/api-links-property.decorator';
import { Links } from '../hateoas/link.types';

export class StockMovementStockResponseDto {
  @ApiProperty({
    description: 'Identificador único do estoque',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Quantidade em estoque após a movimentação',
    example: 15,
  })
  quantity: number;

  @ApiProperty({
    description: 'Quantidade reservada',
    example: 0,
  })
  reserved: number;

  @ApiProperty({
    description: 'Quantidade disponível para saída após a movimentação',
    example: 15,
  })
  available: number;

  @ApiProperty({
    description: 'Data da última atualização do estoque',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

export class StockMovementResponseDto {
  @ApiProperty({
    description: 'Identificador único da movimentação',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'UUID do produto movimentado',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  productId: string;

  @ApiProperty({
    description: 'Tipo da movimentação',
    enum: StockMovementType,
    example: StockMovementType.IN,
  })
  movementType: StockMovementType;

  @ApiProperty({
    description: 'Quantidade movimentada',
    example: 10,
  })
  quantity: number;

  @ApiProperty({
    description: 'Quantidade em estoque antes da movimentação',
    example: 5,
    nullable: true,
  })
  previousQuantity: number | null;

  @ApiProperty({
    description: 'Descrição da movimentação',
    example: 'Entrada de 10 litros de óleo 5W30',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Tipo do registro de origem da movimentação',
    example: 'WORK_ORDER',
    nullable: true,
  })
  referenceType: string | null;

  @ApiProperty({
    description: 'UUID do registro de origem da movimentação',
    example: '550e8400-e29b-41d4-a716-446655440000',
    nullable: true,
  })
  referenceId: string | null;

  @ApiProperty({
    description: 'UUID do usuário que registrou a movimentação',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  createdBy: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Estado do estoque após a movimentação',
    type: StockMovementStockResponseDto,
  })
  stock: StockMovementStockResponseDto;

  @ApiLinksProperty({
    product: { href: '/products/550e8400-e29b-41d4-a716-446655440001', method: 'GET' },
    stock: { href: '/stock?filters=%7B%22productId%22%3A%22550e8400-e29b-41d4-a716-446655440001%22%7D', method: 'GET' },
    'product-movements': { href: '/stock/movements?filters=%7B%22productId%22%3A%22550e8400-e29b-41d4-a716-446655440001%22%7D', method: 'GET' },
    creator: { href: '/users/550e8400-e29b-41d4-a716-446655440000', method: 'GET' },
  })
  _links?: Links;
}
