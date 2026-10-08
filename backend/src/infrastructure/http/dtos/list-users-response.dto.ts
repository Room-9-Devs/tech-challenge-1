import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';
import { PaginationMetaDto } from './pagination-meta.dto';

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
}
