import { Injectable, Inject } from '@nestjs/common';
import { RepairRepository } from '@/domain/repositories/repair.repository';
import { REPAIR_REPOSITORY } from '../create-repair/create-repair.use-case';
import { ListRepairsInputDto } from './list-repairs-input.dto';
import { ListRepairsOutputDto } from './list-repairs-output.dto';

@Injectable()
export class ListRepairsUseCase {
  constructor(
    @Inject(REPAIR_REPOSITORY)
    private readonly repairRepository: RepairRepository,
  ) {}

  async execute(
    input: ListRepairsInputDto = {},
  ): Promise<ListRepairsOutputDto> {
    const { filters, ...paginationQuery } = input;

    const { data, meta } = await this.repairRepository.findAll({
      page: paginationQuery.page ?? 1,
      limit: paginationQuery.limit ?? 10,
      search: paginationQuery.search,
      sort: paginationQuery.sort,
      filters,
    });

    return {
      data: data.map((repair) => ({
        id: repair.id,
        description: repair.description,
        unitValue: repair.unitValue,
        createdAt: repair.createdAt,
        updatedAt: repair.updatedAt,
      })),
      meta,
    };
  }
}
