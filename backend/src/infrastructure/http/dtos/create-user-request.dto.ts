import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateUserRequestDto {
  @ApiProperty({ description: 'Nome de usuário para login.', example: 'agnaldo.guimaraes' })
  @IsString() @IsNotEmpty() @MinLength(3) @MaxLength(100)
  username: string;

  @ApiProperty({
    description: 'E-mail do usuário',
    example: 'agnaldo.guimaraes@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Senha inicial do usuário.', example: 'password123', minLength: 8 })
  @IsString() @IsNotEmpty() @MinLength(8)
  password: string;

  @ApiProperty({ description: 'Tipo de perfil associado à conta.', enum: ['client', 'employee'], example: 'client' })
  @IsIn(['client', 'employee'])
  entityType: 'client' | 'employee';

  @ApiProperty({ description: 'Nome completo do cliente ou funcionário.', example: 'Agnaldo Guimarães' })
  @IsString() @IsNotEmpty() @MaxLength(150)
  name: string;

  @ApiProperty({ description: 'Tipo do documento.', enum: ['CPF', 'CNPJ'], example: 'CPF' })
  @IsIn(['CPF', 'CNPJ'])
  documentType: 'CPF' | 'CNPJ';

  @ApiProperty({ description: 'Número do documento.', example: '123.456.789-00' })
  @IsString() @IsNotEmpty() @MaxLength(14)
  document: string;

  @ApiProperty({ description: 'Telefone do usuário.', example: '(20) 99999-9999' })
  @IsString() @IsNotEmpty() @MaxLength(11)
  phone: string;

  @ApiProperty({ description: 'Cargo do funcionário (se for funcionário).', example: 'Mecânico', required: false })
  @IsOptional() @IsString() @MaxLength(150)
  jobTitle?: string;
}
