import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateUserProfileRequestDto {
  @ApiPropertyOptional({
    description: 'Nome do perfil (cliente ou funcionário)',
    example: 'José Silveira',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({
    description: 'Telefone do perfil',
    example: '(11) 99999-9999',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Cargo do funcionário (apenas para entityType employee)',
    example: 'Mecânico',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  jobTitle?: string;
}

export class UpdateUserRequestDto {
  @ApiPropertyOptional({
    description: 'Nome de usuário para login',
    example: 'jose.silveira.updated',
    minLength: 3,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  username?: string;

  @ApiPropertyOptional({
    description: 'Endereço de e-mail do usuário',
    example: 'jose.silveira.updated@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'E-mail inválido' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Dados do perfil a atualizar (nome, telefone e cargo)',
    type: UpdateUserProfileRequestDto,
    example: {
      name: 'José Silveira Atualizado',
      phone: '(11) 98888-7777',
      jobTitle: 'Mecânico',
    },
  })
  @IsOptional()
  @IsObject()
  profile?: UpdateUserProfileRequestDto;
}
