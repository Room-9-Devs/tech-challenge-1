import { DataSource } from 'typeorm';
import { loadEnvironment } from '../../../config/environment';
import { ClientOrmEntity } from './entities/client.orm-entity';
import { EmployeeOrmEntity } from './entities/employee.orm-entity';
import { RefreshTokenOrmEntity } from './entities/refresh-token.orm-entity';
import { RoleOrmEntity } from './entities/role.orm-entity';
import { UserOrmEntity } from './entities/user.orm-entity';
import { VehicleOrmEntity } from './entities/vehicle.orm-entity';
import { RepairOrmEntity } from './entities/repair.orm-entity';
import { ProductOrmEntity } from './entities/product.orm-entity';
import { StockOrmEntity } from './entities/stock.orm-entity';
import { StockMovementOrmEntity } from './entities/stock-movement.orm-entity';

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
    VehicleOrmEntity,
    RepairOrmEntity,
    ProductOrmEntity,
    StockOrmEntity,
    StockMovementOrmEntity,
  ],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  migrationsRun: false,
  synchronize: false,
});
