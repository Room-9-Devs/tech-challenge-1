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

export class ChangePasswordRequestDto {
  @ApiProperty({ description: 'Senha atual do usuário.', example: 'password123' })
  @IsString() @IsNotEmpty() currentPassword: string;
  @ApiProperty({ description: 'Nova senha do usuário.', example: 'novaSenha123', minLength: 8 })
  @IsString() @MinLength(8) newPassword: string;
}
