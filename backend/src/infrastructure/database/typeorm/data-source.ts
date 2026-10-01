import { DataSource } from 'typeorm';
import { loadEnvironment } from '../../../config/environment';
import { ClientOrmEntity } from './entities/client.orm-entity';
import { EmployeeOrmEntity } from './entities/employee.orm-entity';
import { RefreshTokenOrmEntity } from './entities/refresh-token.orm-entity';
import { RoleOrmEntity } from './entities/role.orm-entity';
import { UserOrmEntity } from './entities/user.orm-entity';
import { CreateAuthUsersSchema1704067200000 } from './migrations/1704067200000-create-auth-users-schema';
import { AddEmployeeDocuments1704067201000 } from './migrations/1704067201000-add-employee-documents';

loadEnvironment();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'app',
  entities: [
    UserOrmEntity,
    RoleOrmEntity,
    ClientOrmEntity,
    EmployeeOrmEntity,
    RefreshTokenOrmEntity,
  ],
  migrations: [CreateAuthUsersSchema1704067200000, AddEmployeeDocuments1704067201000],
  migrationsRun: false,
  synchronize: false,
});
