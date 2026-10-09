import { ApiProperty } from '@nestjs/swagger';
import { StockResponseDto } from './stock-response.dto';
import { PaginationMetaDto } from './pagination-meta.dto';

export class ListStockResponseDto {
  @ApiProperty({
    description: 'Lista de estoques',
    type: [StockResponseDto],
  })
  data: StockResponseDto[];

  @ApiProperty({
    description: 'Metadados da paginação',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}
