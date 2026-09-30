import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Item } from '@/domain/entities/item.entity';
import { ItemRepository } from '@/domain/repositories/item.repository';
import { ItemOrmEntity } from '../entities/item.orm-entity';
import { ItemMapper } from '../mappers/item.mapper';

@Injectable()
export class TypeOrmItemRepository implements ItemRepository {
  constructor(
    @InjectRepository(ItemOrmEntity)
    private readonly repository: Repository<ItemOrmEntity>,
  ) {}

  async save(item: Item): Promise<Item> {
    const ormEntity = ItemMapper.toPersistence(item);
    const saved = await this.repository.save(ormEntity);
    return ItemMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Item | null> {
    const ormEntity = await this.repository.findOne({
      where: { id, active: true },
    });
    return ormEntity ? ItemMapper.toDomain(ormEntity) : null;
  }

  async findAll(): Promise<Item[]> {
    const ormEntities = await this.repository.find({
      where: { active: true },
    });
    return ormEntities.map((entity) => ItemMapper.toDomain(entity));
  }

  async findBySku(sku: string): Promise<Item | null> {
    const ormEntity = await this.repository.findOne({ where: { sku } });
    return ormEntity ? ItemMapper.toDomain(ormEntity) : null;
  }
}
