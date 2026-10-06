import { ApiProperty } from '@nestjs/swagger';
import { RepairResponseDto } from './repair-response.dto';
import { PaginationMetaDto } from './pagination-meta.dto';

export class ListRepairsResponseDto {
  @ApiProperty({
    description: 'Lista de tipos de reparo/serviço',
    type: [RepairResponseDto],
  })
  data: RepairResponseDto[];

  @ApiProperty({
    description: 'Metadados da paginação',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}
