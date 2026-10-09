import { ApiProperty } from '@nestjs/swagger';
import { StockMovementType } from '@/domain/entities/stock-movement.entity';
import { StockProductResponseDto } from './stock-response.dto';
import { PaginationMetaDto } from './pagination-meta.dto';

export class StockMovementListItemResponseDto {
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
    description: 'Produto movimentado',
    type: StockProductResponseDto,
  })
  product: StockProductResponseDto;

  @ApiProperty({
    description: 'Tipo da movimentação',
    enum: StockMovementType,
    example: StockMovementType.OUT,
  })
  movementType: StockMovementType;

  @ApiProperty({
    description: 'Quantidade movimentada',
    example: 4,
  })
  quantity: number;

  @ApiProperty({
    description: 'Quantidade em estoque antes da movimentação',
    example: 10,
    nullable: true,
  })
  previousQuantity: number | null;

  @ApiProperty({
    description: 'Descrição da movimentação',
    example: 'Saída de 4 filtros de óleo',
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
}

export class ListStockMovementsResponseDto {
  @ApiProperty({
    description: 'Lista de movimentações de estoque',
    type: [StockMovementListItemResponseDto],
  })
  data: StockMovementListItemResponseDto[];

  @ApiProperty({
    description: 'Metadados da paginação',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}
