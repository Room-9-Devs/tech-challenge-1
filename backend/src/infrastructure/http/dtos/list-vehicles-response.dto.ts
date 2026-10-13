import { ApiProperty } from '@nestjs/swagger';
import { VehicleResponseDto } from './vehicle-response.dto';
import { PaginationMetaDto } from './pagination-meta.dto';
import { ApiLinksProperty } from '../hateoas/api-links-property.decorator';
import { Links } from '../hateoas/link.types';

export class ListVehiclesResponseDto {
  @ApiProperty({
    description: 'List of vehicles',
    type: [VehicleResponseDto],
  })
  data: VehicleResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;

  @ApiLinksProperty({
    self: { href: '/vehicles?page=1&limit=10', method: 'GET' },
    first: { href: '/vehicles?page=1&limit=10', method: 'GET' },
    next: { href: '/vehicles?page=2&limit=10', method: 'GET' },
    last: { href: '/vehicles?page=3&limit=10', method: 'GET' },
  })
  _links?: Links;
}
