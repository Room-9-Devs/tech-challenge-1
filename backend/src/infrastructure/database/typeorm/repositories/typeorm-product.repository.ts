import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '@/domain/entities/product.entity';
import { ProductRepository } from '@/domain/repositories/product.repository';
import { applyPagination } from '@/shared/pagination/typeorm-pagination.helper';
import { PaginatedOutput, PaginationQuery } from '@/shared/pagination/pagination.types';
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

  async findAll(
    query?: PaginationQuery & { filters?: Record<string, string | number | boolean> },
  ): Promise<PaginatedOutput<Product>> {
    const { filters, ...paginationQuery } = query ?? {
      page: 1,
      limit: 10,
    };

    const queryBuilder = this.repository.createQueryBuilder('product');

    queryBuilder.andWhere('product.active = :active', { active: true });

    const allowedFilters = ['sku', 'name', 'productType', 'unit'];

    if (filters) {
      for (const [key, rawValue] of Object.entries(filters)) {
        if (!allowedFilters.includes(key)) continue;

        const value = rawValue === 'true' ? true : rawValue === 'false' ? false : rawValue;
        const paramName = `filter_${key}`;
        queryBuilder.andWhere(`product.${key} = :${paramName}`, {
          [paramName]: value,
        });
      }
    }

    applyPagination(queryBuilder, paginationQuery, {
      searchColumns: ['product.name', 'product.description', 'product.sku'],
      alias: 'product',
      allowedSortColumns: [
        'name',
        'description',
        'sku',
        'productType',
        'unit',
        'cost',
        'salePrice',
        'active',
        'createdAt',
        'updatedAt',
      ],
    });

    const [ormEntities, totalItems] = await queryBuilder.getManyAndCount();

    return {
      data: ormEntities.map((entity) => ProductMapper.toDomain(entity)),
      meta: {
        page: paginationQuery.page,
        limit: paginationQuery.limit,
        totalItems,
        totalPages: Math.ceil(totalItems / paginationQuery.limit) || 1,
      },
    };
  }

  async findBySku(sku: string): Promise<Product | null> {
    const ormEntity = await this.repository.findOne({ where: { sku } });
    return ormEntity ? ProductMapper.toDomain(ormEntity) : null;
  }
}
