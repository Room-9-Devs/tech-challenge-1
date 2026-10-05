import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsJSON, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '@/shared/pagination/pagination-query.dto';

export class ListRepairsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'JSON de ordenação. Ex: [{"field":"description","order":"asc"}]',
    example: '[{"field":"description","order":"asc"}]',
    type: String,
  })
  @IsOptional()
  @IsJSON()
  sort?: string;

  @ApiPropertyOptional({
    description: 'JSON de filtros. Ex: {"unitValue":120}',
    example: '{"unitValue":120}',
    type: String,
  })
  @IsOptional()
  @IsJSON()
  filters?: string;
}
