import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientOrmEntity } from './typeorm/entities/client.orm-entity';
import { EmployeeOrmEntity } from './typeorm/entities/employee.orm-entity';
import { RefreshTokenOrmEntity } from './typeorm/entities/refresh-token.orm-entity';
import { RoleOrmEntity } from './typeorm/entities/role.orm-entity';
import { UserOrmEntity } from './typeorm/entities/user.orm-entity';
import { TypeOrmUserRepository } from './typeorm/repositories/typeorm-user.repository';
import { USER_REPOSITORY } from '@/application/use-cases/users/create-user/create-user.use-case';
import { TypeOrmRoleRepository } from './typeorm/repositories/typeorm-role.repository';
import { TypeOrmProfileRepository } from './typeorm/repositories/typeorm-profile.repository';
import { TypeOrmRefreshTokenRepository } from './typeorm/repositories/typeorm-refresh-token.repository';
import { ROLE_REPOSITORY } from '@/application/ports/role.repository';
import { PROFILE_REPOSITORY } from '@/application/ports/profile.repository';
import { REFRESH_TOKEN_REPOSITORY } from '@/application/ports/refresh-token.repository';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        entities: [
          UserOrmEntity,
          RoleOrmEntity,
          ClientOrmEntity,
          EmployeeOrmEntity,
          RefreshTokenOrmEntity,
        ],
        migrations: [__dirname + '/typeorm/migrations/*.{ts,js}'],
        migrationsRun: true,
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([
      UserOrmEntity,
      RoleOrmEntity,
      ClientOrmEntity,
      EmployeeOrmEntity,
      RefreshTokenOrmEntity,
    ]),
  ],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
    { provide: ROLE_REPOSITORY, useClass: TypeOrmRoleRepository },
    { provide: PROFILE_REPOSITORY, useClass: TypeOrmProfileRepository },
    { provide: REFRESH_TOKEN_REPOSITORY, useClass: TypeOrmRefreshTokenRepository },
  ],
  exports: [USER_REPOSITORY, ROLE_REPOSITORY, PROFILE_REPOSITORY, REFRESH_TOKEN_REPOSITORY],
})
export class DatabaseModule { }
