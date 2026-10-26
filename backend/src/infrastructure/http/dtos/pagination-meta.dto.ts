import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ description: 'Número da página atual', example: 1 })
  page: number;

  @ApiProperty({ description: 'Quantidade de itens por página', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total de itens disponíveis', example: 47 })
  totalItems: number;

  @ApiProperty({ description: 'Total de páginas', example: 5 })
  totalPages: number;
}
