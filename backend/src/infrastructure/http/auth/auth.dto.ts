import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginRequestDto {
  @ApiProperty({ description: 'E-mail ou nome de usuário.', example: 'jose.silveira' })
  @IsString() @IsNotEmpty() login: string;
  @ApiProperty({ description: 'Senha do usuário.', example: 'password123', minLength: 8 })
  @IsString() @MinLength(8) password: string;
}

export class RefreshTokenRequestDto {
  @ApiProperty({ description: 'Refresh token recebido no login.', example: 'eyJhbGciOi...' })
  @IsString() @IsNotEmpty() refreshToken: string;
}

export class AuthUserResponseDto {
  @ApiProperty({ description: 'ID do usuário.', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;
  @ApiProperty({ description: 'Nome de usuário.', example: 'jose.silveira' })
  username: string;
  @ApiProperty({ description: 'E-mail do usuário.', example: 'jose.silveira@example.com' })
  email: string;
  @ApiProperty({ description: 'Slug do role do usuário.', example: 'admin' })
  role: string;
  @ApiProperty({ description: 'Tipo de pessoa vinculada ao usuário.', enum: ['client', 'employee'], example: 'employee' })
  entityType: string;
}

export class RefreshTokenResponseDto {
  @ApiProperty({ description: 'JWT de acesso; enviar no header Authorization: Bearer <token>.', example: 'eyJhbGciOi...' })
  accessToken: string;
  @ApiProperty({ description: 'Refresh token opaco; a cada renovação o anterior deixa de valer (rotação).', example: 'Zk3n0q8YtV1x...' })
  refreshToken: string;
  @ApiProperty({ description: 'Validade do token de acesso, em segundos.', example: 900 })
  expiresIn: number;
}

export class LoginResponseDto extends RefreshTokenResponseDto {
  @ApiProperty({ description: 'Usuário autenticado.', type: AuthUserResponseDto })
  user: AuthUserResponseDto;
}

export class ChangePasswordRequestDto {
  @ApiProperty({ description: 'Senha atual do usuário.', example: 'password123' })
  @IsString() @IsNotEmpty() currentPassword: string;
  @ApiProperty({ description: 'Nova senha do usuário.', example: 'novaSenha123', minLength: 8 })
  @IsString() @MinLength(8) newPassword: string;
}
