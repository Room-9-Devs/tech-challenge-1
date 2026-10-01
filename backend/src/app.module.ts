import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ENV_FILE_PATH } from './config/environment';
import { DatabaseModule } from './infrastructure/database/database.module';
import { UsersController } from './infrastructure/http/controllers/users.controller';
import { CreateUserUseCase } from './application/use-cases/users/create-user/create-user.use-case';
import { FindUserUseCase } from './application/use-cases/users/find-user/find-user.use-case';
import { ListUsersUseCase } from './application/use-cases/users/list-users/list-users.use-case';
import { JwtModule } from '@nestjs/jwt';
import { ScryptPasswordHasherService } from './infrastructure/services/password/scrypt-password-hasher.service';
import { JwtTokenService } from './infrastructure/services/jwt/jwt-token.service';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { TOKEN_SERVICE } from './application/ports/token-service.port';
import { REFRESH_TOKEN_SERVICE } from './application/ports/refresh-token-service.port';
import { OpaqueRefreshTokenService } from './infrastructure/services/jwt/opaque-refresh-token.service';
import { LoginUseCase } from './application/use-cases/auth/login.use-case';
import { LogoutUseCase } from './application/use-cases/auth/logout.use-case';
import { RefreshTokenUseCase } from './application/use-cases/auth/refresh-token.use-case';
import { ChangePasswordUseCase } from './application/use-cases/auth/change-password.use-case';
import { AuthController } from './infrastructure/http/auth/auth.controller';
import { JwtAuthGuard } from './infrastructure/http/auth/jwt-auth.guard';
import { RolesGuard } from './infrastructure/http/auth/roles.guard';
import { ListRolesUseCase } from './application/use-cases/permissions/list-roles.use-case';
import { ChangeRoleUseCase } from './application/use-cases/permissions/change-role.use-case';
import { PermissionsController } from './infrastructure/http/permissions/permissions.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ENV_FILE_PATH,
    }),
    DatabaseModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'development-secret-change-me',
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as `${number}${'s' | 'm' | 'h' | 'd'}` },
    }),
  ],
  controllers: [UsersController, AuthController, PermissionsController],
  providers: [
    CreateUserUseCase,
    FindUserUseCase,
    ListUsersUseCase,
    { provide: PASSWORD_HASHER, useClass: ScryptPasswordHasherService },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: REFRESH_TOKEN_SERVICE, useClass: OpaqueRefreshTokenService },
    LoginUseCase,
    LogoutUseCase,
    RefreshTokenUseCase,
    ChangePasswordUseCase,
    JwtAuthGuard,
    RolesGuard,
    ListRolesUseCase,
    ChangeRoleUseCase,
  ],
})
export class AppModule { }
