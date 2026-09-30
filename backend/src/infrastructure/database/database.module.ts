import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserOrmEntity } from './typeorm/entities/user.orm-entity';
import { ServiceTypeOrmEntity } from './typeorm/entities/service-type.orm-entity';
import { TypeOrmUserRepository } from './typeorm/repositories/typeorm-user.repository';
import { TypeOrmServiceTypeRepository } from './typeorm/repositories/typeorm-service-type.repository';
import { USER_REPOSITORY } from '@/application/use-cases/users/create-user/create-user.use-case';
import { SERVICE_TYPE_REPOSITORY } from '@/application/use-cases/service-types/create-service-type/create-service-type.use-case';

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
        entities: [UserOrmEntity, ServiceTypeOrmEntity],
        migrations: [__dirname + '/typeorm/migrations/*.{ts,js}'],
        migrationsRun: true,
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([UserOrmEntity, ServiceTypeOrmEntity]),
  ],
  providers: [
    {
      provide: USER_REPOSITORY,
      useClass: TypeOrmUserRepository,
    },
    {
      provide: SERVICE_TYPE_REPOSITORY,
      useClass: TypeOrmServiceTypeRepository,
    },
  ],
  exports: [USER_REPOSITORY, SERVICE_TYPE_REPOSITORY],
})
export class DatabaseModule {}
