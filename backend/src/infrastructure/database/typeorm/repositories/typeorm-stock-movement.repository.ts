import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockMovement } from '@/domain/entities/stock-movement.entity';
import {
  StockMovementQuery,
  StockMovementRepository,
  StockMovementWithProduct,
} from '@/domain/repositories/stock-movement.repository';
import { applyPagination } from '@/shared/pagination/typeorm-pagination.helper';
import { PaginatedOutput } from '@/shared/pagination/pagination.types';
import { StockMovementOrmEntity } from '../entities/stock-movement.orm-entity';
import { StockMovementMapper } from '../mappers/stock-movement.mapper';
import { ProductMapper } from '../mappers/product.mapper';

@Injectable()
export class TypeOrmStockMovementRepository implements StockMovementRepository {
  constructor(
    @InjectRepository(StockMovementOrmEntity)
    private readonly repository: Repository<StockMovementOrmEntity>,
  ) {}

  async save(stockMovement: StockMovement): Promise<StockMovement> {
    const ormEntity = StockMovementMapper.toPersistence(stockMovement);
    const saved = await this.repository.save(ormEntity);
    return StockMovementMapper.toDomain(saved);
  }

  async findAll(
    query?: StockMovementQuery,
  ): Promise<PaginatedOutput<StockMovementWithProduct>> {
    const { filters, startDate, endDate, ...paginationQuery } = query ?? {
      page: 1,
      limit: 10,
    };

    const queryBuilder = this.repository
      .createQueryBuilder('movement')
      .innerJoinAndSelect('movement.product', 'product')
      .orderBy('movement.createdAt', 'DESC');

    const allowedFilters = ['productId', 'movementType', 'createdBy'];

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (!allowedFilters.includes(key)) continue;

        const paramName = `filter_${key}`;
        queryBuilder.andWhere(`movement.${key} = :${paramName}`, {
          [paramName]: value,
        });
      }
    }

    if (startDate) {
      queryBuilder.andWhere('movement.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('movement.createdAt <= :endDate', { endDate });
    }

    applyPagination(queryBuilder, paginationQuery, {
      searchColumns: ['product.name', 'product.sku'],
      alias: 'movement',
      allowedSortColumns: ['createdAt', 'quantity', 'movementType'],
    });

    // Desempate estável: sem ele, itens com o mesmo valor de ordenação
    // podem se repetir ou sumir entre páginas.
    queryBuilder.addOrderBy('movement.id', 'ASC');

    const [ormEntities, totalItems] = await queryBuilder.getManyAndCount();

    return {
      data: ormEntities.map((entity) => ({
        stockMovement: StockMovementMapper.toDomain(entity),
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
