import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsJSON, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '@/shared/pagination/pagination-query.dto';

export class ListUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'JSON de ordenação. Ex: [{"field":"username","order":"asc"}]',
    example: '[{"field":"username","order":"asc"}]',
    type: String,
  })
  @IsOptional()
  @IsJSON()
  sort?: string;

  @ApiPropertyOptional({
    description: 'JSON de filtros. Ex: {"username":"quiteria.dantas"}',
    example: '{"username":"quiteria.dantas"}',
    type: String,
  })
  @IsOptional()
  @IsJSON()
  filters?: string;
}
