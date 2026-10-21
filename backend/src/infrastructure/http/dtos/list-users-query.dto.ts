import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsJSON, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '@/shared/pagination/pagination-query.dto';

export class ListUsersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'JSON de ordenação. Ex: [{"field":"username","order":"asc"}]',
    example: '[{"field":"username","order":"asc"}]',
    type: String,
  })
  @IsOptional()
  @IsJSON()
  sort?: string;

  @ApiPropertyOptional({
    description: 'Busca por nome de usuário, e-mail ou nome do perfil',
    example: 'Quitéria',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description:
      'JSON de filtros por username, email, entityType (client ou employee), profile.name, ' +
      'cpf, cnpj ou profile.document (CPF ou CNPJ, sem distinguir o tipo). Documentos são aceitos ' +
      'com ou sem máscara. Para identificar o cliente pelo documento: {"cpf":"529.982.247-25"} ou ' +
      '{"cnpj":"11.222.333/0001-81"}',
    example: '{"cpf":"529.982.247-25"}',
    type: String,
  })
  @IsOptional()
  @IsJSON()
  filters?: string;
}
