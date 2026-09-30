import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { UsersController } from './infrastructure/http/controllers/users.controller';
import { ServiceTypesController } from './infrastructure/http/controllers/service-types.controller';
import { ItemsController } from './infrastructure/http/controllers/items.controller';
import { CreateUserUseCase } from './application/use-cases/users/create-user/create-user.use-case';
import { FindUserUseCase } from './application/use-cases/users/find-user/find-user.use-case';
import { ListUsersUseCase } from './application/use-cases/users/list-users/list-users.use-case';
import { CreateServiceTypeUseCase } from './application/use-cases/service-types/create-service-type/create-service-type.use-case';
import { FindServiceTypeUseCase } from './application/use-cases/service-types/find-service-type/find-service-type.use-case';
import { ListServiceTypesUseCase } from './application/use-cases/service-types/list-service-types/list-service-types.use-case';
import { UpdateServiceTypeUseCase } from './application/use-cases/service-types/update-service-type/update-service-type.use-case';
import { DeleteServiceTypeUseCase } from './application/use-cases/service-types/delete-service-type/delete-service-type.use-case';
import { CreateItemUseCase } from './application/use-cases/items/create-item/create-item.use-case';
import { ListItemsUseCase } from './application/use-cases/items/list-items/list-items.use-case';
import { UpdateItemUseCase } from './application/use-cases/items/update-item/update-item.use-case';
import { DeleteItemUseCase } from './application/use-cases/items/delete-item/delete-item.use-case';
import { ServiceTypeSeedService } from './infrastructure/database/typeorm/seeds/service-type.seed';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
  ],
  controllers: [UsersController, ServiceTypesController, ItemsController],
  providers: [
    CreateUserUseCase,
    FindUserUseCase,
    ListUsersUseCase,
    CreateServiceTypeUseCase,
    FindServiceTypeUseCase,
    ListServiceTypesUseCase,
    UpdateServiceTypeUseCase,
    DeleteServiceTypeUseCase,
    CreateItemUseCase,
    ListItemsUseCase,
    UpdateItemUseCase,
    DeleteItemUseCase,
    ServiceTypeSeedService,
  ],
})
export class AppModule {}
