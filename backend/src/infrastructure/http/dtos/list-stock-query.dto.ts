import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsJSON, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '@/shared/pagination/pagination-query.dto';

export class ListStockQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'JSON de ordenação. Ex: [{"field":"quantity","order":"asc"}]',
    example: '[{"field":"quantity","order":"asc"}]',
    type: String,
  })
  @IsOptional()
  @IsJSON()
  sort?: string;

  @ApiPropertyOptional({
    description:
      'JSON de filtros. Ex: {"productId":"550e8400-e29b-41d4-a716-446655440000"}',
    example: '{"productId":"550e8400-e29b-41d4-a716-446655440000"}',
    type: String,
  })
  @IsOptional()
  @IsJSON()
  filters?: string;
}
