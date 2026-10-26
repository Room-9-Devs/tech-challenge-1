import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  UserRegistrationRepositories,
  UserRegistrationUnitOfWork,
} from '@/application/ports/user-registration-unit-of-work.port';
import { TypeOrmUserRepository } from './repositories/typeorm-user.repository';
import { TypeOrmProfileRepository } from './repositories/typeorm-profile.repository';
import { UserOrmEntity } from './entities/user.orm-entity';
import { ClientOrmEntity } from './entities/client.orm-entity';
import { EmployeeOrmEntity } from './entities/employee.orm-entity';

@Injectable()
export class TypeOrmUserRegistrationUnitOfWork implements UserRegistrationUnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  run<T>(
    work: (repositories: UserRegistrationRepositories) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction((manager) =>
      work({
        users: new TypeOrmUserRepository(manager.getRepository(UserOrmEntity)),
        profiles: new TypeOrmProfileRepository(
          manager.getRepository(ClientOrmEntity),
          manager.getRepository(EmployeeOrmEntity),
        ),
      }),
    );
  }
}
