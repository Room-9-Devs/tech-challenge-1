import { Injectable, Inject } from '@nestjs/common';
import { RepairRepository } from '@/domain/repositories/repair.repository';
import { REPAIR_REPOSITORY } from '../create-repair/create-repair.use-case';
import { ListRepairsOutputDto } from './list-repairs-output.dto';

@Injectable()
export class ListRepairsUseCase {
  constructor(
    @Inject(REPAIR_REPOSITORY)
    private readonly repairRepository: RepairRepository,
  ) {}

  async execute(): Promise<ListRepairsOutputDto> {
    const repairs = await this.repairRepository.findAll();

    return {
      repairs: repairs.map((repair) => ({
        id: repair.id,
        description: repair.description,
        unitValue: repair.unitValue,
        createdAt: repair.createdAt,
        updatedAt: repair.updatedAt,
      })),
    };
  }
}
