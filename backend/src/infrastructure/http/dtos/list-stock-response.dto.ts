import { ApiProperty } from '@nestjs/swagger';
import { StockResponseDto } from './stock-response.dto';
import { PaginationMetaDto } from './pagination-meta.dto';
import { ApiLinksProperty } from '../hateoas/api-links-property.decorator';
import { Links } from '../hateoas/link.types';

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

  @ApiLinksProperty({
    self: { href: '/stock?page=1&limit=10', method: 'GET' },
    first: { href: '/stock?page=1&limit=10', method: 'GET' },
    next: { href: '/stock?page=2&limit=10', method: 'GET' },
    last: { href: '/stock?page=2&limit=10', method: 'GET' },
    movements: { href: '/stock/movements', method: 'GET' },
  })
  _links?: Links;
}
