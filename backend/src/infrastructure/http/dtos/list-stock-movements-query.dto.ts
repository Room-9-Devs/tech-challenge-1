import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsJSON, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '@/shared/pagination/pagination-query.dto';

export class ListStockMovementsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'JSON de ordenação. Ex: [{"field":"createdAt","order":"desc"}]',
    example: '[{"field":"createdAt","order":"desc"}]',
    type: String,
  })
  @IsOptional()
  @IsJSON()
  sort?: string;

  @ApiPropertyOptional({
    description:
      'JSON de filtros. Ex: {"productId":"550e8400-e29b-41d4-a716-446655440000","movementType":"OUT"}',
    example: '{"movementType":"OUT"}',
    type: String,
  })
  @IsOptional()
  @IsJSON()
  filters?: string;

  @ApiPropertyOptional({
    description: 'Data inicial do período (ISO 8601)',
    example: '2026-10-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'startDate deve ser uma data ISO 8601 válida' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Data final do período (ISO 8601)',
    example: '2026-10-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsISO8601({}, { message: 'endDate deve ser uma data ISO 8601 válida' })
  endDate?: string;
}
