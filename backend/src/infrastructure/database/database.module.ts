import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserOrmEntity } from './typeorm/entities/user.orm-entity';
import { ServiceTypeOrmEntity } from './typeorm/entities/service-type.orm-entity';
import { ItemOrmEntity } from './typeorm/entities/item.orm-entity';
import { StockOrmEntity } from './typeorm/entities/stock.orm-entity';
import { TypeOrmUserRepository } from './typeorm/repositories/typeorm-user.repository';
import { TypeOrmServiceTypeRepository } from './typeorm/repositories/typeorm-service-type.repository';
import { TypeOrmItemRepository } from './typeorm/repositories/typeorm-item.repository';
import { TypeOrmStockRepository } from './typeorm/repositories/typeorm-stock.repository';
import { USER_REPOSITORY } from '@/application/use-cases/users/create-user/create-user.use-case';
import { SERVICE_TYPE_REPOSITORY } from '@/application/use-cases/service-types/create-service-type/create-service-type.use-case';
import { ITEM_REPOSITORY } from '@/application/use-cases/items/create-item/create-item.use-case';
import { STOCK_REPOSITORY } from '@/application/use-cases/items/delete-item/delete-item.use-case';

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
          ServiceTypeOrmEntity,
          ItemOrmEntity,
          StockOrmEntity,
        ],
        migrations: [__dirname + '/typeorm/migrations/*.{ts,js}'],
        migrationsRun: true,
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([
      UserOrmEntity,
      ServiceTypeOrmEntity,
      ItemOrmEntity,
      StockOrmEntity,
    ]),
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
    {
      provide: ITEM_REPOSITORY,
      useClass: TypeOrmItemRepository,
    },
    {
      provide: STOCK_REPOSITORY,
      useClass: TypeOrmStockRepository,
    },
  ],
  exports: [
    USER_REPOSITORY,
    SERVICE_TYPE_REPOSITORY,
    ITEM_REPOSITORY,
    STOCK_REPOSITORY,
  ],
})
export class DatabaseModule {}
