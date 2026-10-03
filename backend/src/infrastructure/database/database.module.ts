import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientOrmEntity } from './typeorm/entities/client.orm-entity';
import { EmployeeOrmEntity } from './typeorm/entities/employee.orm-entity';
import { RefreshTokenOrmEntity } from './typeorm/entities/refresh-token.orm-entity';
import { RoleOrmEntity } from './typeorm/entities/role.orm-entity';
import { UserOrmEntity } from './typeorm/entities/user.orm-entity';
import { ServiceTypeOrmEntity } from './typeorm/entities/service-type.orm-entity';
import { VehicleOrmEntity } from './typeorm/entities/vehicle.orm-entity';
import { TypeOrmUserRepository } from './typeorm/repositories/typeorm-user.repository';
import { TypeOrmServiceTypeRepository } from './typeorm/repositories/typeorm-service-type.repository';
import { TypeOrmRoleRepository } from './typeorm/repositories/typeorm-role.repository';
import { TypeOrmProfileRepository } from './typeorm/repositories/typeorm-profile.repository';
import { TypeOrmRefreshTokenRepository } from './typeorm/repositories/typeorm-refresh-token.repository';
import { TypeOrmVehicleRepository } from './typeorm/repositories/typeorm-vehicle.repository';
import { USER_REPOSITORY } from '@/application/use-cases/users/create-user/create-user.use-case';
import { SERVICE_TYPE_REPOSITORY } from '@/application/use-cases/service-types/create-service-type/create-service-type.use-case';
import { VEHICLE_REPOSITORY } from '@/application/use-cases/vehicles/create-vehicle/create-vehicle.use-case';
import { ROLE_REPOSITORY } from '@/application/ports/role.repository';
import { PROFILE_REPOSITORY } from '@/application/ports/profile.repository';
import { REFRESH_TOKEN_REPOSITORY } from '@/application/ports/refresh-token.repository';
import { USER_REGISTRATION_UNIT_OF_WORK } from '@/application/ports/user-registration-unit-of-work.port';
import { TypeOrmUserRegistrationUnitOfWork } from './typeorm/typeorm-user-registration-unit-of-work';

const ormEntities = [
  UserOrmEntity,
  RoleOrmEntity,
  ClientOrmEntity,
  EmployeeOrmEntity,
  RefreshTokenOrmEntity,
  ServiceTypeOrmEntity,
  VehicleOrmEntity,
];

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
        entities: ormEntities,
        migrations: [__dirname + '/typeorm/migrations/*.{ts,js}'],
        migrationsRun: true,
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature(ormEntities),
  ],
  providers: [
    { provide: USER_REPOSITORY, useClass: TypeOrmUserRepository },
    {
      provide: SERVICE_TYPE_REPOSITORY,
      useClass: TypeOrmServiceTypeRepository,
    },
    { provide: ROLE_REPOSITORY, useClass: TypeOrmRoleRepository },
    { provide: PROFILE_REPOSITORY, useClass: TypeOrmProfileRepository },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: TypeOrmRefreshTokenRepository,
    },
    { provide: VEHICLE_REPOSITORY, useClass: TypeOrmVehicleRepository },
    {
      provide: USER_REGISTRATION_UNIT_OF_WORK,
      useClass: TypeOrmUserRegistrationUnitOfWork,
    },
  ],
  exports: [
    USER_REPOSITORY,
    SERVICE_TYPE_REPOSITORY,
    ROLE_REPOSITORY,
    PROFILE_REPOSITORY,
    REFRESH_TOKEN_REPOSITORY,
    VEHICLE_REPOSITORY,
    USER_REGISTRATION_UNIT_OF_WORK,
  ],
})
export class DatabaseModule {}
