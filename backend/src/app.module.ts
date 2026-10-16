import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ENV_FILE_PATH, requireEnvironmentVariable } from './config/environment';
import { DatabaseModule } from './infrastructure/database/database.module';
import { EmailModule } from './infrastructure/services/email/email.module';
import { UsersController } from './infrastructure/http/controllers/users.controller';
import { RepairsController } from './infrastructure/http/controllers/repairs.controller';
import { ProductsController } from './infrastructure/http/controllers/products.controller';
import { StockController } from './infrastructure/http/controllers/stock.controller';
import { AuthController } from './infrastructure/http/auth/auth.controller';
import { PermissionsController } from './infrastructure/http/permissions/permissions.controller';
import { VehiclesController } from './infrastructure/http/controllers/vehicles.controller';
import { EventTypesController } from './infrastructure/http/controllers/event-types.controller';
import { EventsController } from './infrastructure/http/controllers/events.controller';
import { CreateUserUseCase } from './application/use-cases/users/create-user/create-user.use-case';
import { FindUserUseCase } from './application/use-cases/users/find-user/find-user.use-case';
import { ListUsersUseCase } from './application/use-cases/users/list-users/list-users.use-case';
import { CreateRepairUseCase } from './application/use-cases/repairs/create-repair/create-repair.use-case';
import { FindRepairUseCase } from './application/use-cases/repairs/find-repair/find-repair.use-case';
import { ListRepairsUseCase } from './application/use-cases/repairs/list-repairs/list-repairs.use-case';
import { UpdateRepairUseCase } from './application/use-cases/repairs/update-repair/update-repair.use-case';
import { DeleteRepairUseCase } from './application/use-cases/repairs/delete-repair/delete-repair.use-case';
import { CreateProductUseCase } from './application/use-cases/products/create-product/create-product.use-case';
import { ListProductsUseCase } from './application/use-cases/products/list-products/list-products.use-case';
import { FindProductUseCase } from './application/use-cases/products/find-product/find-product.use-case';
import { UpdateProductUseCase } from './application/use-cases/products/update-product/update-product.use-case';
import { DeleteProductUseCase } from './application/use-cases/products/delete-product/delete-product.use-case';
import { ActivateProductUseCase } from './application/use-cases/products/activate-product/activate-product.use-case';
import { ListStockUseCase } from './application/use-cases/stock/list-stock/list-stock.use-case';
import { CreateStockMovementUseCase } from './application/use-cases/stock/create-stock-movement/create-stock-movement.use-case';
import { ListStockMovementsUseCase } from './application/use-cases/stock/list-stock-movements/list-stock-movements.use-case';
import { RepairSeedService } from './infrastructure/database/typeorm/seeds/repair.seed';
import { ProductSeedService } from './infrastructure/database/typeorm/seeds/product.seed';
import { EventTypeSeedService } from './infrastructure/database/seeds/event-type.seed';
import { ScryptPasswordHasherService } from './infrastructure/services/password/scrypt-password-hasher.service';
import { JwtTokenService } from './infrastructure/services/jwt/jwt-token.service';
import { OpaqueRefreshTokenService } from './infrastructure/services/jwt/opaque-refresh-token.service';
import { EventRecorderService } from './application/services/event-recorder.service';
import { NestDomainEventPublisher } from './infrastructure/services/events/nest-domain-event-publisher.service';
import { DomainEventEmitter } from './infrastructure/services/events/domain-event-emitter.service';
import { UserEventAuditHandler } from './application/event-handlers/user-event-audit.handler';
import { VehicleEventAuditHandler } from './application/event-handlers/vehicle-event-audit.handler';
import { ProductEventAuditHandler } from './application/event-handlers/product-event-audit.handler';
import { StockEventAuditHandler } from './application/event-handlers/stock-event-audit.handler';
import { RepairEventAuditHandler } from './application/event-handlers/repair-event-audit.handler';
import { ClientEventAuditHandler } from './application/event-handlers/client-event-audit.handler';
import { EmployeeEventAuditHandler } from './application/event-handlers/employee-event-audit.handler';
import { AuthEventAuditHandler } from './application/event-handlers/auth-event-audit.handler';
import { WorkOrderEventAuditHandler } from './application/event-handlers/work-order-event-audit.handler';
import { WorkOrderNotificationHandler } from './application/event-handlers/work-order-notification.handler';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { TOKEN_SERVICE } from './application/ports/token-service.port';
import { REFRESH_TOKEN_SERVICE } from './application/ports/refresh-token-service.port';
import { EVENT_RECORDER } from './application/ports/event-recorder.port';
import { DOMAIN_EVENT_PUBLISHER } from './application/ports/domain-event-publisher.port';
import { LoginUseCase } from './application/use-cases/auth/login.use-case';
import { LogoutUseCase } from './application/use-cases/auth/logout.use-case';
import { RefreshTokenUseCase } from './application/use-cases/auth/refresh-token.use-case';
import { ChangePasswordUseCase } from './application/use-cases/auth/change-password.use-case';
import { JwtAuthGuard } from './infrastructure/http/auth/jwt-auth.guard';
import { RolesGuard } from './infrastructure/http/auth/roles.guard';
import { CurrentUserInterceptor } from './infrastructure/http/auth/current-user.interceptor';
import { FindCurrentUserUseCase } from './application/use-cases/users/find-current-user/find-current-user.use-case';
import { ListRolesUseCase } from './application/use-cases/permissions/list-roles.use-case';
import { ChangeRoleUseCase } from './application/use-cases/permissions/change-role.use-case';
import { CreateVehicleUseCase } from './application/use-cases/vehicles/create-vehicle/create-vehicle.use-case';
import { FindVehicleUseCase } from './application/use-cases/vehicles/find-vehicle/find-vehicle.use-case';
import { ListVehiclesUseCase } from './application/use-cases/vehicles/list-vehicles/list-vehicles.use-case';
import { UpdateVehicleUseCase } from './application/use-cases/vehicles/update-vehicle.use-case';
import { DeleteVehicleUseCase } from './application/use-cases/vehicles/delete-vehicle.use-case';
import { GetFipeDataUseCase } from './application/use-cases/vehicles/get-fipe-data.use-case';
import { CreateEventTypeUseCase } from './application/use-cases/events/event-type/create-event-type/create-event-type.use-case';
import { UpdateEventTypeUseCase } from './application/use-cases/events/event-type/update-event-type/update-event-type.use-case';
import { ListEventTypesUseCase } from './application/use-cases/events/event-type/list-event-types/list-event-types.use-case';
import { FindEventTypeUseCase } from './application/use-cases/events/event-type/find-event-type/find-event-type.use-case';
import { RecordEventUseCase } from './application/use-cases/events/record-event/record-event.use-case';
import { ListEventsByEntityIdUseCase } from './application/use-cases/events/list-events-by-entity-id/list-events-by-entity-id.use-case';
import { FIPE_GATEWAY } from './application/ports/fipe.gateway';
import { ParallelumFipeGateway } from './infrastructure/services/fipe/parallelum-fipe.gateway';
import { WorkOrdersController } from './infrastructure/http/controllers/work-orders.controller';
import { CreateWorkOrderUseCase } from './application/use-cases/work-orders/create-work-order/create-work-order.use-case';
import { ListWorkOrdersUseCase } from './application/use-cases/work-orders/list-work-orders/list-work-orders.use-case';
import { FindWorkOrderUseCase } from './application/use-cases/work-orders/find-work-order/find-work-order.use-case';
import { AddWorkOrderItemUseCase } from './application/use-cases/work-orders/add-work-order-item/add-work-order-item.use-case';
import { ChangeWorkOrderItemUseCase } from './application/use-cases/work-orders/change-work-order-item/change-work-order-item.use-case';
import { RemoveWorkOrderItemUseCase } from './application/use-cases/work-orders/remove-work-order-item/remove-work-order-item.use-case';
import { ChangeWorkOrderStatusUseCase } from './application/use-cases/work-orders/change-work-order-status/change-work-order-status.use-case';
import { ConfirmWorkOrderPaymentUseCase } from './application/use-cases/work-orders/confirm-work-order-payment/confirm-work-order-payment.use-case';
import { WORK_ORDER_NOTIFIER } from './application/ports/work-order-notifier.port';
import { EmailWorkOrderNotifier } from './infrastructure/services/email/email-work-order-notifier';
import { WorkOrderApprovalsController } from './infrastructure/http/controllers/work-order-approvals.controller';
import { WorkOrderQuoteService } from './application/services/work-order-quote.service';
import {
  IssueWorkOrderApprovalTokenUseCase,
  WORK_ORDER_APPROVAL_TTL_HOURS,
} from './application/use-cases/work-order-approvals/issue-work-order-approval-token/issue-work-order-approval-token.use-case';
import { GetWorkOrderApprovalUseCase } from './application/use-cases/work-order-approvals/get-work-order-approval/get-work-order-approval.use-case';
import { DecideWorkOrderApprovalUseCase } from './application/use-cases/work-order-approvals/decide-work-order-approval/decide-work-order-approval.use-case';

const DEFAULT_WORK_ORDER_APPROVAL_TTL_HOURS = 72;

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ENV_FILE_PATH }),
    DatabaseModule,
    JwtModule.register({
      secret: requireEnvironmentVariable('JWT_SECRET'),
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ||
          '15m') as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    }),
    EmailModule,
  ],
  controllers: [
    UsersController,
    RepairsController,
    ProductsController,
    StockController,
    VehiclesController,
    EventTypesController,
    EventsController,
    WorkOrdersController,
    WorkOrderApprovalsController,
    AuthController,
    PermissionsController,
  ],
  providers: [
    CreateUserUseCase,
    FindUserUseCase,
    ListUsersUseCase,
    CreateVehicleUseCase,
    FindVehicleUseCase,
    ListVehiclesUseCase,
    UpdateVehicleUseCase,
    DeleteVehicleUseCase,
    GetFipeDataUseCase,
    CreateEventTypeUseCase,
    UpdateEventTypeUseCase,
    ListEventTypesUseCase,
    FindEventTypeUseCase,
    RecordEventUseCase,
    ListEventsByEntityIdUseCase,
    DomainEventEmitter,
    { provide: EVENT_RECORDER, useClass: EventRecorderService },
    { provide: DOMAIN_EVENT_PUBLISHER, useClass: NestDomainEventPublisher },
    UserEventAuditHandler,
    VehicleEventAuditHandler,
    ProductEventAuditHandler,
    StockEventAuditHandler,
    RepairEventAuditHandler,
    ClientEventAuditHandler,
    EmployeeEventAuditHandler,
    AuthEventAuditHandler,
    WorkOrderEventAuditHandler,
    WorkOrderNotificationHandler,
    EventTypeSeedService,
    { provide: FIPE_GATEWAY, useClass: ParallelumFipeGateway },
    CreateRepairUseCase,
    FindRepairUseCase,
    ListRepairsUseCase,
    UpdateRepairUseCase,
    DeleteRepairUseCase,
    CreateProductUseCase,
    ListProductsUseCase,
    FindProductUseCase,
    UpdateProductUseCase,
    DeleteProductUseCase,
    ActivateProductUseCase,
    ListStockUseCase,
    CreateStockMovementUseCase,
    ListStockMovementsUseCase,
    RepairSeedService,
    ProductSeedService,
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
    FindCurrentUserUseCase,
    CreateWorkOrderUseCase,
    ListWorkOrdersUseCase,
    FindWorkOrderUseCase,
    AddWorkOrderItemUseCase,
    ChangeWorkOrderItemUseCase,
    RemoveWorkOrderItemUseCase,
    ChangeWorkOrderStatusUseCase,
    ConfirmWorkOrderPaymentUseCase,
    { provide: WORK_ORDER_NOTIFIER, useClass: EmailWorkOrderNotifier },
    WorkOrderQuoteService,
    {
      provide: WORK_ORDER_APPROVAL_TTL_HOURS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        Number(config.get('WORK_ORDER_APPROVAL_TTL_HOURS')) ||
        DEFAULT_WORK_ORDER_APPROVAL_TTL_HOURS,
    },
    IssueWorkOrderApprovalTokenUseCase,
    GetWorkOrderApprovalUseCase,
    DecideWorkOrderApprovalUseCase,
    CurrentUserInterceptor,
  ],
})
export class AppModule {}
