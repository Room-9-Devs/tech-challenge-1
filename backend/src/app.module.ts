import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { UsersController } from './infrastructure/http/controllers/users.controller';
import { CreateUserUseCase } from './application/use-cases/users/create-user/create-user.use-case';
import { FindUserUseCase } from './application/use-cases/users/find-user/find-user.use-case';
import { ListUsersUseCase } from './application/use-cases/users/list-users/list-users.use-case';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
  ],
  controllers: [UsersController],
  providers: [CreateUserUseCase, FindUserUseCase, ListUsersUseCase],
})
export class AppModule {}
