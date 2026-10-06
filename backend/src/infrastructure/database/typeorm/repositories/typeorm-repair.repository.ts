import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Repair } from '@/domain/entities/repair.entity';
import { RepairRepository } from '@/domain/repositories/repair.repository';
import { applyPagination } from '@/shared/pagination/typeorm-pagination.helper';
import { PaginatedOutput, PaginationQuery } from '@/shared/pagination/pagination.types';
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
    const ormEntity = await this.repository.findOne({
      where: { id, deletedAt: IsNull() },
    });
    return ormEntity ? RepairMapper.toDomain(ormEntity) : null;
  }

  async findAll(
    query?: PaginationQuery & { filters?: Record<string, string | number> },
  ): Promise<PaginatedOutput<Repair>> {
    const { filters, ...paginationQuery } = query ?? {
      page: 1,
      limit: 10,
    };

    const queryBuilder = this.repository.createQueryBuilder('repair');

    queryBuilder.andWhere('repair.deletedAt IS NULL');

    const allowedFilters = ['description', 'unitValue'];

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (!allowedFilters.includes(key)) continue;

        const paramName = `filter_${key}`;
        queryBuilder.andWhere(`repair.${key} = :${paramName}`, {
          [paramName]: value,
        });
      }
    }

    applyPagination(queryBuilder, paginationQuery, {
      searchColumns: ['repair.description'],
      alias: 'repair',
      allowedSortColumns: [
        'description',
        'unitValue',
        'createdAt',
        'updatedAt',
      ],
    });

    const [ormEntities, totalItems] = await queryBuilder.getManyAndCount();

    return {
      data: ormEntities.map((entity) => RepairMapper.toDomain(entity)),
      meta: {
        page: paginationQuery.page,
        limit: paginationQuery.limit,
        totalItems,
        totalPages: Math.ceil(totalItems / paginationQuery.limit) || 1,
      },
    };
  }

  async findByDescription(description: string): Promise<Repair | null> {
    const ormEntity = await this.repository.findOne({
      where: { description, deletedAt: IsNull() },
    });
    return ormEntity ? RepairMapper.toDomain(ormEntity) : null;
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
