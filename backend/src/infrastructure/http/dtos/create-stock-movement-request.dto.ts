import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  MAX_STOCK_QUANTITY,
  StockMovementType,
} from '@/domain/entities/stock-movement.entity';

export class CreateStockMovementRequestDto {
  @ApiProperty({
    description: 'UUID do produto movimentado',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('all', { message: 'O produto deve ser um UUID válido' })
  productId: string;

  @ApiProperty({
    description:
      'Tipo da movimentação. IN soma ao estoque, OUT subtrai do estoque e ADJUSTMENT define a quantidade atual do estoque',
    enum: StockMovementType,
    example: StockMovementType.IN,
  })
  @IsEnum(StockMovementType, {
    message: 'O tipo da movimentação deve ser IN, OUT ou ADJUSTMENT',
  })
  movementType: StockMovementType;

  @ApiProperty({
    description:
      'Quantidade movimentada. Deve ser maior que 0 para IN e OUT e maior ou igual a 0 para ADJUSTMENT',
    example: 10,
    minimum: 0,
    maximum: MAX_STOCK_QUANTITY,
  })
  @IsInt({ message: 'A quantidade deve ser um número inteiro' })
  @Min(0, { message: 'A quantidade deve ser maior ou igual a 0' })
  @Max(MAX_STOCK_QUANTITY, {
    message: `A quantidade deve ser menor ou igual a ${MAX_STOCK_QUANTITY}`,
  })
  quantity: number;

  @ApiPropertyOptional({
    description: 'Descrição da movimentação',
    example: 'Entrada de 10 litros de óleo 5W30',
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: 'A descrição deve ser uma string' })
  @MaxLength(500, {
    message: 'A descrição deve ter no máximo 500 caracteres',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Tipo do registro de origem da movimentação',
    example: 'WORK_ORDER',
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'O tipo de referência deve ser uma string' })
  @MaxLength(50, {
    message: 'O tipo de referência deve ter no máximo 50 caracteres',
  })
  referenceType?: string;

  @ApiPropertyOptional({
    description: 'UUID do registro de origem da movimentação',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsUUID('all', { message: 'A referência deve ser um UUID válido' })
  referenceId?: string;
}
