import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

export class UpdateUserProfileRequestDto {
  @ApiPropertyOptional({
    description: 'Nome do perfil (cliente ou funcionário)',
    example: 'José Silveira',
    maxLength: 150,
  })
  // Opcional quando ausente; null e texto só com espaços são recusados.
  @ValidateIf((_, value) => value !== undefined)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({
    description: 'Telefone do perfil',
    example: '(11) 99999-9999',
  })
  // Opcional quando ausente; null é recusado (a coluna é obrigatória). O formato é validado pelo value object Phone.
  @ValidateIf((_, value) => value !== undefined)
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
  @ValidateNested()
  @Type(() => UpdateUserProfileRequestDto)
  profile?: UpdateUserProfileRequestDto;
}
