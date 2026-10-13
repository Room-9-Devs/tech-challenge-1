import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';
import { PaginationMetaDto } from './pagination-meta.dto';
import { ApiLinksProperty } from '../hateoas/api-links-property.decorator';
import { Links } from '../hateoas/link.types';

export class ListUsersResponseDto {
  @ApiProperty({
    description: 'Lista de usuários',
    type: [UserResponseDto],
  })
  data: UserResponseDto[];

  @ApiProperty({
    description: 'Metadados da paginação',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;

  @ApiLinksProperty({
    self: { href: '/users?page=1&limit=10', method: 'GET' },
    first: { href: '/users?page=1&limit=10', method: 'GET' },
    next: { href: '/users?page=2&limit=10', method: 'GET' },
    last: { href: '/users?page=3&limit=10', method: 'GET' },
    create: { href: '/users', method: 'POST' },
  })
  _links?: Links;
}
