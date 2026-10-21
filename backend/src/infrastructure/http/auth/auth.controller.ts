import { Body, Controller, HttpCode, HttpStatus, Post, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { LoginUseCase } from '@/application/use-cases/auth/login.use-case';
import { LogoutUseCase } from '@/application/use-cases/auth/logout.use-case';
import { RefreshTokenUseCase } from '@/application/use-cases/auth/refresh-token.use-case';
import { ChangePasswordUseCase } from '@/application/use-cases/auth/change-password.use-case';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LoginRequestDto, RefreshTokenRequestDto, ChangePasswordRequestDto } from './auth.dto';
import { AccessTokenPayload } from '@/application/ports/token-service.port';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(private readonly login: LoginUseCase, private readonly refresh: RefreshTokenUseCase, private readonly logout: LogoutUseCase, private readonly changePassword: ChangePasswordUseCase) { }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login', description: 'Autentica o usuário e retorna os tokens de acesso e de atualização.' })
  @ApiBody({ type: LoginRequestDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tokens de autenticação retornados.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Credenciais inválidas.' })
  loginUser(@Body() dto: LoginRequestDto) { return this.login.execute(dto); }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Atualizar token', description: 'Rotaciona o refresh token e retorna um novo token de acesso.' })
  @ApiBody({ type: RefreshTokenRequestDto })
  @ApiResponse({ status: HttpStatus.OK, description: 'Tokens atualizados.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Refresh token inválido ou expirado.' })
  refreshToken(@Body() dto: RefreshTokenRequestDto) { return this.refresh.execute(dto.refreshToken); }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout', description: 'Revoga o refresh token informado.' })
  @ApiBody({ type: RefreshTokenRequestDto })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Sessão revogada.' })
  logoutUser(@Body() dto: RefreshTokenRequestDto) { return this.logout.execute(dto.refreshToken); }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Alterar senha' })
  @ApiBody({ type: ChangePasswordRequestDto })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Senha alterada e sessões de refresh revogadas.' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Autenticação ou senha atual inválida.' })
  change(@Req() request: Request & { user: AccessTokenPayload }, @Body() dto: ChangePasswordRequestDto) {
    return this.changePassword.execute(request.user.sub, dto.currentPassword, dto.newPassword);
  }
}
