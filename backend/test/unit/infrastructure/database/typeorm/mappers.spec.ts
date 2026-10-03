import { User } from '@/domain/entities/user.entity';
import { ServiceType } from '@/domain/entities/service-type.entity';
import { UserMapper } from '@/infrastructure/database/typeorm/mappers/user.mapper';
import { ServiceTypeMapper } from '@/infrastructure/database/typeorm/mappers/service-type.mapper';
import { makeUser } from '../../../../fakes/user-fixture';

describe('TypeORM mappers', () => {
  it('maps users in both directions', () => {
    const user = makeUser();
    const persistence = UserMapper.toPersistence(user);
    const domain = UserMapper.toDomain(persistence);
    expect(persistence.username).toBe(user.username);
    expect(domain.id).toBe(user.id);
    expect(domain.roleId).toBe(user.roleId);
  });

  it('maps service types in both directions', () => {
    const serviceType = ServiceType.create({ description: 'Troca de óleo', unitValue: 120 });
    const persistence = ServiceTypeMapper.toPersistence(serviceType);
    const domain = ServiceTypeMapper.toDomain(persistence);
    expect(persistence.description).toBe(serviceType.description);
    expect(domain.unitValue).toBe(120);
  });
});
