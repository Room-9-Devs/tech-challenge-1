import { User } from '@/domain/entities/user.entity';
import { UserOrmEntity } from '../entities/user.orm-entity';

export class UserMapper {
  static toDomain(ormEntity: UserOrmEntity): User {
    return User.reconstitute({
      id: ormEntity.id,
      username: ormEntity.username,
      email: ormEntity.email,
      password: ormEntity.password,
      entityType: ormEntity.entityType,
      entityId: ormEntity.entityId,
      roleId: ormEntity.roleId,
      deletedAt: ormEntity.deletedAt ?? null,
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    });
  }

  static toPersistence(domainEntity: User): UserOrmEntity {
    const ormEntity = new UserOrmEntity();
    ormEntity.id = domainEntity.id;
    ormEntity.username = domainEntity.username;
    ormEntity.email = domainEntity.email;
    ormEntity.password = domainEntity.password;
    ormEntity.entityType = domainEntity.entityType;
    ormEntity.entityId = domainEntity.entityId;
    ormEntity.roleId = domainEntity.roleId;
    ormEntity.deletedAt = domainEntity.deletedAt ?? null;
    ormEntity.createdAt = domainEntity.createdAt;
    ormEntity.updatedAt = domainEntity.updatedAt;
    return ormEntity;
  }
}
