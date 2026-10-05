import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';
import { SortOrder } from './pagination.types';

export class SortQueryDto {
  @ApiPropertyOptional({
    description: 'Nome do campo para ordenação',
    example: 'createdAt',
  })
  @IsString()
  field: string;

  @ApiPropertyOptional({
    description: 'Direção da ordenação',
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsIn(['asc', 'desc'])
  order: SortOrder;
}
