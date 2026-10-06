import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { EmailModule } from './infrastructure/services/email/email.module';
import { UsersController } from './infrastructure/http/controllers/users.controller';
import { ServiceTypesController } from './infrastructure/http/controllers/service-types.controller';
import { CreateUserUseCase } from './application/use-cases/users/create-user/create-user.use-case';
import { FindUserUseCase } from './application/use-cases/users/find-user/find-user.use-case';
import { ListUsersUseCase } from './application/use-cases/users/list-users/list-users.use-case';
import { CreateServiceTypeUseCase } from './application/use-cases/service-types/create-service-type/create-service-type.use-case';
import { FindServiceTypeUseCase } from './application/use-cases/service-types/find-service-type/find-service-type.use-case';
import { ListServiceTypesUseCase } from './application/use-cases/service-types/list-service-types/list-service-types.use-case';
import { UpdateServiceTypeUseCase } from './application/use-cases/service-types/update-service-type/update-service-type.use-case';
import { DeleteServiceTypeUseCase } from './application/use-cases/service-types/delete-service-type/delete-service-type.use-case';
import { ServiceTypeSeedService } from './infrastructure/database/typeorm/seeds/service-type.seed';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    EmailModule,
  ],
  controllers: [UsersController, ServiceTypesController],
  providers: [
    CreateUserUseCase,
    FindUserUseCase,
    ListUsersUseCase,
    CreateServiceTypeUseCase,
    FindServiceTypeUseCase,
    ListServiceTypesUseCase,
    UpdateServiceTypeUseCase,
    DeleteServiceTypeUseCase,
    ServiceTypeSeedService,
  ],
})
export class AppModule {}
