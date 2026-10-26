import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientOrmEntity } from './typeorm/entities/client.orm-entity';
import { EmployeeOrmEntity } from './typeorm/entities/employee.orm-entity';
import { RefreshTokenOrmEntity } from './typeorm/entities/refresh-token.orm-entity';
import { RoleOrmEntity } from './typeorm/entities/role.orm-entity';
import { UserOrmEntity } from './typeorm/entities/user.orm-entity';
import { VehicleOrmEntity } from './typeorm/entities/vehicle.orm-entity';
import { RepairOrmEntity } from './typeorm/entities/repair.orm-entity';
import { ProductOrmEntity } from './typeorm/entities/product.orm-entity';
import { StockOrmEntity } from './typeorm/entities/stock.orm-entity';
import { EventTypeOrmEntity } from './typeorm/entities/event-type.orm-entity';
import { EventOrmEntity } from './typeorm/entities/event.orm-entity';
import { StockMovementOrmEntity } from './typeorm/entities/stock-movement.orm-entity';
import { TypeOrmUserRepository } from './typeorm/repositories/typeorm-user.repository';
import { TypeOrmRepairRepository } from './typeorm/repositories/typeorm-repair.repository';
import { TypeOrmProductRepository } from './typeorm/repositories/typeorm-product.repository';
import { TypeOrmStockRepository } from './typeorm/repositories/typeorm-stock.repository';
import { TypeOrmRoleRepository } from './typeorm/repositories/typeorm-role.repository';
import { TypeOrmProfileRepository } from './typeorm/repositories/typeorm-profile.repository';
import { TypeOrmRefreshTokenRepository } from './typeorm/repositories/typeorm-refresh-token.repository';
import { TypeOrmVehicleRepository } from './typeorm/repositories/typeorm-vehicle.repository';
import { TypeOrmEventTypeRepository } from './typeorm/repositories/typeorm-event-type.repository';
import { TypeOrmEventRepository } from './typeorm/repositories/typeorm-event.repository';
import { USER_REPOSITORY } from '@/application/use-cases/users/create-user/create-user.use-case';
import { VEHICLE_REPOSITORY } from '@/application/use-cases/vehicles/create-vehicle/create-vehicle.use-case';
import { REPAIR_REPOSITORY } from '@/application/use-cases/repairs/create-repair/create-repair.use-case';
import { PRODUCT_REPOSITORY } from '@/application/use-cases/products/create-product/create-product.use-case';
import { STOCK_REPOSITORY } from '@/application/use-cases/products/delete-product/delete-product.use-case';
import { ROLE_REPOSITORY } from '@/application/ports/role.repository';
import { PROFILE_REPOSITORY } from '@/application/ports/profile.repository';
import { REFRESH_TOKEN_REPOSITORY } from '@/application/ports/refresh-token.repository';
import { EVENT_TYPE_REPOSITORY } from '@/domain/repositories/event-type.repository';
import { EVENT_REPOSITORY } from '@/domain/repositories/event.repository';
import { USER_REGISTRATION_UNIT_OF_WORK } from '@/application/ports/user-registration-unit-of-work.port';
import { TypeOrmUserRegistrationUnitOfWork } from './typeorm/typeorm-user-registration-unit-of-work';
import { STOCK_MOVEMENT_UNIT_OF_WORK } from '@/application/ports/stock-movement-unit-of-work.port';
import { TypeOrmStockMovementUnitOfWork } from './typeorm/typeorm-stock-movement-unit-of-work';
import { TypeOrmStockMovementRepository } from './typeorm/repositories/typeorm-stock-movement.repository';
import { STOCK_MOVEMENT_REPOSITORY } from '@/application/use-cases/stock/list-stock-movements/list-stock-movements.use-case';
import { PRODUCT_CREATION_UNIT_OF_WORK } from '@/application/ports/product-creation-unit-of-work.port';
import { TypeOrmProductCreationUnitOfWork } from './typeorm/typeorm-product-creation-unit-of-work';
import { WorkOrderOrmEntity } from './typeorm/entities/work-order.orm-entity';
import { WorkOrderItemOrmEntity } from './typeorm/entities/work-order-item.orm-entity';
import { WorkOrderApprovalTokenOrmEntity } from './typeorm/entities/work-order-approval-token.orm-entity';
import { TypeOrmWorkOrderApprovalTokenRepository } from './typeorm/repositories/typeorm-work-order-approval-token.repository';
import { WORK_ORDER_APPROVAL_TOKEN_REPOSITORY } from '@/application/ports/work-order-approval-token.repository';
import { TypeOrmWorkOrderRepository } from './typeorm/repositories/typeorm-work-order.repository';
import { TypeOrmWorkOrderUnitOfWork } from './typeorm/typeorm-work-order-unit-of-work';
import { TypeOrmWorkOrderNumberGenerator } from './typeorm/services/typeorm-work-order-number-generator';
import { WORK_ORDER_REPOSITORY } from '@/domain/repositories/work-order.repository';
import { WORK_ORDER_UNIT_OF_WORK } from '@/application/ports/work-order-unit-of-work.port';
import { WORK_ORDER_NUMBER_GENERATOR } from '@/application/ports/work-order-number-generator.port';
import { WORK_ORDER_STATS_REPOSITORY } from '@/application/ports/work-order-stats.repository';
import { TypeOrmWorkOrderStatsRepository } from './typeorm/repositories/typeorm-work-order-stats.repository';

const ormEntities = [
  UserOrmEntity,
  RoleOrmEntity,
  ClientOrmEntity,
  EmployeeOrmEntity,
  RefreshTokenOrmEntity,
  RepairOrmEntity,
  ProductOrmEntity,
  StockOrmEntity,
  StockMovementOrmEntity,
  VehicleOrmEntity,
  EventTypeOrmEntity,
  EventOrmEntity,
  WorkOrderOrmEntity,
  WorkOrderItemOrmEntity,
  WorkOrderApprovalTokenOrmEntity,
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
    { provide: REPAIR_REPOSITORY, useClass: TypeOrmRepairRepository },
    { provide: PRODUCT_REPOSITORY, useClass: TypeOrmProductRepository },
    { provide: WORK_ORDER_REPOSITORY, useClass: TypeOrmWorkOrderRepository },
    {
      provide: WORK_ORDER_UNIT_OF_WORK,
      useClass: TypeOrmWorkOrderUnitOfWork,
    },
    {
      provide: WORK_ORDER_NUMBER_GENERATOR,
      useClass: TypeOrmWorkOrderNumberGenerator,
    },
    {
      provide: WORK_ORDER_STATS_REPOSITORY,
      useClass: TypeOrmWorkOrderStatsRepository,
    },
    {
      provide: WORK_ORDER_APPROVAL_TOKEN_REPOSITORY,
      useClass: TypeOrmWorkOrderApprovalTokenRepository,
    },
    { provide: STOCK_REPOSITORY, useClass: TypeOrmStockRepository },
    {
      provide: STOCK_MOVEMENT_REPOSITORY,
      useClass: TypeOrmStockMovementRepository,
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
    { provide: EVENT_TYPE_REPOSITORY, useClass: TypeOrmEventTypeRepository },
    { provide: EVENT_REPOSITORY, useClass: TypeOrmEventRepository },
    {
      provide: STOCK_MOVEMENT_UNIT_OF_WORK,
      useClass: TypeOrmStockMovementUnitOfWork,
    },
    {
      provide: PRODUCT_CREATION_UNIT_OF_WORK,
      useClass: TypeOrmProductCreationUnitOfWork,
    },
  ],
  exports: [
    USER_REPOSITORY,
    REPAIR_REPOSITORY,
    PRODUCT_REPOSITORY,
    WORK_ORDER_REPOSITORY,
    WORK_ORDER_UNIT_OF_WORK,
    WORK_ORDER_NUMBER_GENERATOR,
    WORK_ORDER_STATS_REPOSITORY,
    WORK_ORDER_APPROVAL_TOKEN_REPOSITORY,
    STOCK_REPOSITORY,
    STOCK_MOVEMENT_REPOSITORY,
    ROLE_REPOSITORY,
    PROFILE_REPOSITORY,
    REFRESH_TOKEN_REPOSITORY,
    VEHICLE_REPOSITORY,
    USER_REGISTRATION_UNIT_OF_WORK,
    EVENT_TYPE_REPOSITORY,
    EVENT_REPOSITORY,
    STOCK_MOVEMENT_UNIT_OF_WORK,
    PRODUCT_CREATION_UNIT_OF_WORK,
  ],
})
export class DatabaseModule {}
