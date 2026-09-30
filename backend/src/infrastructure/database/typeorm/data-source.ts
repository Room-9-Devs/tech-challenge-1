import { DataSource } from 'typeorm';
import { UserOrmEntity } from './entities/user.orm-entity';
import { ServiceTypeOrmEntity } from './entities/service-type.orm-entity';
import { ItemOrmEntity } from './entities/item.orm-entity';
import { StockOrmEntity } from './entities/stock.orm-entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'app',
  entities: [
    UserOrmEntity,
    ServiceTypeOrmEntity,
    ItemOrmEntity,
    StockOrmEntity,
  ],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  migrationsRun: false,
  synchronize: false,
});
