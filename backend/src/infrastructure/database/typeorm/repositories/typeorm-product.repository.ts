import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '@/domain/entities/product.entity';
import { ProductRepository } from '@/domain/repositories/product.repository';
import { ProductOrmEntity } from '../entities/product.orm-entity';
import { ProductMapper } from '../mappers/product.mapper';

@Injectable()
export class TypeOrmProductRepository implements ProductRepository {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly repository: Repository<ProductOrmEntity>,
  ) {}

  async save(product: Product): Promise<Product> {
    const ormEntity = ProductMapper.toPersistence(product);
    const saved = await this.repository.save(ormEntity);
    return ProductMapper.toDomain(saved);
  }

  async findById(id: string): Promise<Product | null> {
    const ormEntity = await this.repository.findOne({
      where: { id, active: true },
    });
    return ormEntity ? ProductMapper.toDomain(ormEntity) : null;
  }

  async findAll(): Promise<Product[]> {
    const ormEntities = await this.repository.find({
      where: { active: true },
    });
    return ormEntities.map((entity) => ProductMapper.toDomain(entity));
  }

  async findBySku(sku: string): Promise<Product | null> {
    const ormEntity = await this.repository.findOne({ where: { sku } });
    return ormEntity ? ProductMapper.toDomain(ormEntity) : null;
  }
}
