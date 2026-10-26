jest.mock('@nestjs/jwt', () => ({ JwtModule: { register: jest.fn().mockReturnValue({}) }, JwtService: class {} }));

import { AppModule } from '@/app.module';
import { DatabaseModule } from '@/infrastructure/database/database.module';
import { AppDataSource } from '@/infrastructure/database/typeorm/data-source';
import { loadEnvironment } from '@/config/environment';
import { UserOrmEntity } from '@/infrastructure/database/typeorm/entities/user.orm-entity';
import { ClientOrmEntity } from '@/infrastructure/database/typeorm/entities/client.orm-entity';
import { EmployeeOrmEntity } from '@/infrastructure/database/typeorm/entities/employee.orm-entity';
import { RoleOrmEntity } from '@/infrastructure/database/typeorm/entities/role.orm-entity';
import { RefreshTokenOrmEntity } from '@/infrastructure/database/typeorm/entities/refresh-token.orm-entity';
import { RepairOrmEntity } from '@/infrastructure/database/typeorm/entities/repair.orm-entity';
import * as domainErrors from '@/domain/errors';
import { getMetadataArgsStorage } from 'typeorm';

describe('application composition', () => {
  it('loads the application and database modules', () => {
    expect(AppModule).toBeDefined();
    expect(DatabaseModule).toBeDefined();
    expect(AppDataSource.options.entities).toContain(UserOrmEntity);
    expect(AppDataSource.options.entities).toContain(RepairOrmEntity);
  });

  it('loads environment configuration and domain errors', () => {
    expect(() => loadEnvironment()).not.toThrow();
    expect(domainErrors.AuthenticationError).toBeDefined();
    expect(domainErrors.InvalidRoleAssignmentError).toBeDefined();
    expect(domainErrors.InvalidRepairError).toBeDefined();
  });

  it('can instantiate ORM entities', () => {
    expect(new UserOrmEntity()).toBeInstanceOf(UserOrmEntity);
    expect(new ClientOrmEntity()).toBeInstanceOf(ClientOrmEntity);
    expect(new EmployeeOrmEntity()).toBeInstanceOf(EmployeeOrmEntity);
    expect(new RoleOrmEntity()).toBeInstanceOf(RoleOrmEntity);
    expect(new RefreshTokenOrmEntity()).toBeInstanceOf(RefreshTokenOrmEntity);
    expect(new RepairOrmEntity()).toBeInstanceOf(RepairOrmEntity);
    const unitValueColumn = getMetadataArgsStorage().columns.find((column) => column.target === RepairOrmEntity && column.propertyName === 'unitValue');
    const transformer = (unitValueColumn?.options as any).transformer;
    expect(transformer.from(null)).toBeNull();
    expect(transformer.from('120.50')).toBe(120.5);
    expect(transformer.from(80)).toBe(80);
    expect(transformer.to(90)).toBe(90);
  });
});
