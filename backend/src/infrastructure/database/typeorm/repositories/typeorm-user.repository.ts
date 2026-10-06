import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from '@/domain/entities/user.entity';
import {
  UserFilter,
  UserRepository,
} from '@/domain/repositories/user.repository';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { UserMapper } from '../mappers/user.mapper';
import { UserAlreadyExistsError } from '@/domain/errors/user-already-exists.error';

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repository: Repository<UserOrmEntity>,
  ) {}

  async save(user: User): Promise<User> {
    const ormEntity = UserMapper.toPersistence(user);
    try {
      const saved = await this.repository.save(ormEntity);
      return UserMapper.toDomain(saved);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError.code === '23505'
      ) {
        throw new UserAlreadyExistsError(user.email);
      }
      throw error;
    }
  }

  async findById(id: string): Promise<User | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? UserMapper.toDomain(ormEntity) : null;
  }

  async findAll(filter?: UserFilter): Promise<User[]> {
    const query = this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role');
    if (filter?.entityType)
      query.andWhere('user.entityType = :entityType', {
        entityType: filter.entityType,
      });
    if (filter?.roleSlug)
      query.andWhere('role.slug = :roleSlug', { roleSlug: filter.roleSlug });
    const ormEntities = await query.getMany();
    return ormEntities.map((entity) => UserMapper.toDomain(entity));
  }

  async findByEmail(email: string): Promise<User | null> {
    const ormEntity = await this.repository.findOne({ where: { email } });
    return ormEntity ? UserMapper.toDomain(ormEntity) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const ormEntity = await this.repository.findOne({ where: { username } });
    return ormEntity ? UserMapper.toDomain(ormEntity) : null;
  }
}
