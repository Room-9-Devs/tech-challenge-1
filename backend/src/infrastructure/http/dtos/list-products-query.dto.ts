import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsJSON, IsOptional, IsString, Max, Min } from 'class-validator';

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 100;

export class ListProductsQueryDto {
  @ApiPropertyOptional({
    description: 'Número da página',
    minimum: 1,
    default: DEFAULT_PAGE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = DEFAULT_PAGE;

  @ApiPropertyOptional({
    description: 'Quantidade de itens por página',
    minimum: 1,
    maximum: MAX_LIMIT,
    default: DEFAULT_LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_LIMIT)
  limit?: number = DEFAULT_LIMIT;

  @ApiPropertyOptional({
    description: 'Termo de busca textual',
    example: 'filtro de óleo',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'JSON de ordenação. Ex: [{"field":"createdAt","order":"desc"}]',
    example: '[{"field":"createdAt","order":"desc"}]',
  })
  @IsOptional()
  @IsJSON()
  sort?: string;

  @ApiPropertyOptional({
    description: 'JSON de filtros. Ex: {"productType":"PART"}',
    example: '{"productType":"PART"}',
  })
  @IsOptional()
  @IsJSON()
  filters?: string;
}
