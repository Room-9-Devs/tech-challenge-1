import { User } from '@/domain/entities/user.entity';
import { Repair } from '@/domain/entities/repair.entity';
import { UserMapper } from '@/infrastructure/database/typeorm/mappers/user.mapper';
import { RepairMapper } from '@/infrastructure/database/typeorm/mappers/repair.mapper';
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

  it('maps repairs in both directions', () => {
    const repair = Repair.create({ description: 'Troca de óleo', unitValue: 120 });
    const persistence = RepairMapper.toPersistence(repair);
    const domain = RepairMapper.toDomain(persistence);
    expect(persistence.description).toBe(repair.description);
    expect(domain.unitValue).toBe(120);
  });
});
