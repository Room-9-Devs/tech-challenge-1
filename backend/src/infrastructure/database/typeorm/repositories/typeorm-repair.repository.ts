import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Repair } from '@/domain/entities/repair.entity';
import { RepairRepository } from '@/domain/repositories/repair.repository';
import { RepairOrmEntity } from '../entities/repair.orm-entity';
import { RepairMapper } from '../mappers/repair.mapper';

@Injectable()
export class TypeOrmRepairRepository implements RepairRepository {
  constructor(
    @InjectRepository(RepairOrmEntity)
    private readonly repository: Repository<RepairOrmEntity>,
  ) {}

  async save(repair: Repair): Promise<Repair> {
    const ormEntity = RepairMapper.toPersistence(repair);
    const saved = await this.repository.save(ormEntity);
    return RepairMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Repair | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? RepairMapper.toDomain(ormEntity) : null;
  }

  async findAll(): Promise<Repair[]> {
    const ormEntities = await this.repository.find();
    return ormEntities.map((entity) => RepairMapper.toDomain(entity));
  }

  async findByDescription(description: string): Promise<Repair | null> {
    const ormEntity = await this.repository.findOne({
      where: { description },
    });
    return ormEntity ? RepairMapper.toDomain(ormEntity) : null;
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
