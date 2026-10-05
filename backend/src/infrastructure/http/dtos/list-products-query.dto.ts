import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsJSON, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '@/shared/pagination/pagination-query.dto';

export class ListProductsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'JSON de ordenação. Ex: [{"field":"createdAt","order":"desc"}]',
    example: '[{"field":"createdAt","order":"desc"}]',
    type: String,
  })
  @IsOptional()
  @IsJSON()
  sort?: string;

  @ApiPropertyOptional({
    description: 'JSON de filtros. Ex: {"productType":"PART"}',
    example: '{"productType":"PART"}',
    type: String,
  })
  @IsOptional()
  @IsJSON()
  filters?: string;
}
