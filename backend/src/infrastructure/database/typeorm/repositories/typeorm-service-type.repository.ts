import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceType } from '@/domain/entities/service-type.entity';
import { ServiceTypeRepository } from '@/domain/repositories/service-type.repository';
import { ServiceTypeOrmEntity } from '../entities/service-type.orm-entity';
import { ServiceTypeMapper } from '../mappers/service-type.mapper';

@Injectable()
export class TypeOrmServiceTypeRepository implements ServiceTypeRepository {
  constructor(
    @InjectRepository(ServiceTypeOrmEntity)
    private readonly repository: Repository<ServiceTypeOrmEntity>,
  ) {}

  async save(serviceType: ServiceType): Promise<ServiceType> {
    const ormEntity = ServiceTypeMapper.toPersistence(serviceType);
    const saved = await this.repository.save(ormEntity);
    return ServiceTypeMapper.toDomain(saved);
  }

  async findById(id: string): Promise<ServiceType | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? ServiceTypeMapper.toDomain(ormEntity) : null;
  }

  async findAll(): Promise<ServiceType[]> {
    const ormEntities = await this.repository.find();
    return ormEntities.map((entity) => ServiceTypeMapper.toDomain(entity));
  }

  async findByDescription(description: string): Promise<ServiceType | null> {
    const ormEntity = await this.repository.findOne({
      where: { description },
    });
    return ormEntity ? ServiceTypeMapper.toDomain(ormEntity) : null;
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
