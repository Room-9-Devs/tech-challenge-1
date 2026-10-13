import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock } from '@/domain/entities/stock.entity';
import {
  StockRepository,
  StockWithProduct,
} from '@/domain/repositories/stock.repository';
import { applyPagination } from '@/shared/pagination/typeorm-pagination.helper';
import { PaginatedOutput, PaginationQuery } from '@/shared/pagination/pagination.types';
import { StockOrmEntity } from '../entities/stock.orm-entity';
import { StockMapper } from '../mappers/stock.mapper';
import { ProductMapper } from '../mappers/product.mapper';

@Injectable()
export class TypeOrmStockRepository implements StockRepository {
  constructor(
    @InjectRepository(StockOrmEntity)
    private readonly repository: Repository<StockOrmEntity>,
  ) {}

  async save(stock: Stock): Promise<Stock> {
    const ormEntity = StockMapper.toPersistence(stock);
    const saved = await this.repository.save(ormEntity);
    return StockMapper.toDomain(saved);
  }

  async findByProductId(productId: string): Promise<Stock | null> {
    const ormEntity = await this.repository.findOne({
      where: { productId },
      ...(this.repository.queryRunner?.isTransactionActive && {
        lock: { mode: 'pessimistic_write' as const },
      }),
    });
    return ormEntity ? StockMapper.toDomain(ormEntity) : null;
  }

  async findAll(
    query?: PaginationQuery & { filters?: Record<string, string | number | boolean> },
  ): Promise<PaginatedOutput<StockWithProduct>> {
    const { filters, ...paginationQuery } = query ?? {
      page: 1,
      limit: 10,
    };

    const queryBuilder = this.repository
      .createQueryBuilder('stock')
      .innerJoinAndSelect('stock.product', 'product')
      .andWhere('product.active = :active', { active: true });

    const allowedFilters = ['productId'];

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (!allowedFilters.includes(key)) continue;

        const paramName = `filter_${key}`;
        queryBuilder.andWhere(`stock.${key} = :${paramName}`, {
          [paramName]: value,
        });
      }
    }

    applyPagination(queryBuilder, paginationQuery, {
      searchColumns: ['product.name', 'product.sku'],
      alias: 'stock',
      allowedSortColumns: ['quantity', 'reserved', 'createdAt', 'updatedAt'],
    });

    // Desempate estável: sem ele, itens com o mesmo valor de ordenação
    // podem se repetir ou sumir entre páginas.
    queryBuilder.addOrderBy('stock.id', 'ASC');

    const [ormEntities, totalItems] = await queryBuilder.getManyAndCount();

    return {
      data: ormEntities.map((entity) => ({
        stock: StockMapper.toDomain(entity),
        product: ProductMapper.toDomain(entity.product),
      })),
      meta: {
        page: paginationQuery.page,
        limit: paginationQuery.limit,
        totalItems,
        totalPages: Math.ceil(totalItems / paginationQuery.limit) || 1,
      },
    };
  }
}
