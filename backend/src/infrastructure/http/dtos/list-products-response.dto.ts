import { ApiProperty } from '@nestjs/swagger';
import { ProductResponseDto } from './product-response.dto';
import { PaginationMetaDto } from './pagination-meta.dto';
import { ApiLinksProperty } from '../hateoas/api-links-property.decorator';
import { Links } from '../hateoas/link.types';

export class ListProductsResponseDto {
  @ApiProperty({
    description: 'Lista de produtos',
    type: [ProductResponseDto],
  })
  data: ProductResponseDto[];

  @ApiProperty({
    description: 'Metadados da paginação',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;

  @ApiLinksProperty({
    self: { href: '/products?page=2&limit=10', method: 'GET' },
    first: { href: '/products?page=1&limit=10', method: 'GET' },
    prev: { href: '/products?page=1&limit=10', method: 'GET' },
    next: { href: '/products?page=3&limit=10', method: 'GET' },
    last: { href: '/products?page=5&limit=10', method: 'GET' },
    create: { href: '/products', method: 'POST' },
  })
  _links?: Links;
}
