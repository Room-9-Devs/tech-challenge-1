import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from './pagination-meta.dto';
import { WorkOrderSummaryResponseDto } from './work-order-response.dto';
import { ApiLinksProperty } from '../hateoas/api-links-property.decorator';
import { Links } from '../hateoas/link.types';

export class ListWorkOrdersResponseDto {
  @ApiProperty({
    type: [WorkOrderSummaryResponseDto],
    description: 'Resumo de cada OS; os itens ficam apenas no GET /:id',
  })
  data: WorkOrderSummaryResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;

  @ApiLinksProperty({
    self: { href: '/work-orders?page=1&limit=10', method: 'GET' },
    first: { href: '/work-orders?page=1&limit=10', method: 'GET' },
    next: { href: '/work-orders?page=2&limit=10', method: 'GET' },
    last: { href: '/work-orders?page=3&limit=10', method: 'GET' },
    create: { href: '/work-orders', method: 'POST' },
  })
  _links?: Links;
}
