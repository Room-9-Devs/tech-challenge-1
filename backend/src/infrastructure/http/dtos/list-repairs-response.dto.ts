import { ApiProperty } from '@nestjs/swagger';
import { RepairResponseDto } from './repair-response.dto';
import { PaginationMetaDto } from './pagination-meta.dto';
import { ApiLinksProperty } from '../hateoas/api-links-property.decorator';
import { Links } from '../hateoas/link.types';

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

  @ApiLinksProperty({
    self: { href: '/repairs?page=1&limit=10', method: 'GET' },
    first: { href: '/repairs?page=1&limit=10', method: 'GET' },
    next: { href: '/repairs?page=2&limit=10', method: 'GET' },
    last: { href: '/repairs?page=3&limit=10', method: 'GET' },
    create: { href: '/repairs', method: 'POST' },
  })
  _links?: Links;
}
