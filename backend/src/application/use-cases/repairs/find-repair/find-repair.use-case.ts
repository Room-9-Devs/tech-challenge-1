import { Injectable, Inject } from '@nestjs/common';
import { RepairRepository } from '@/domain/repositories/repair.repository';
import { RepairNotFoundError } from '@/domain/errors/repair-not-found.error';
import { REPAIR_REPOSITORY } from '../create-repair/create-repair.use-case';
import { FindRepairInputDto } from './find-repair-input.dto';
import { FindRepairOutputDto } from './find-repair-output.dto';

@Injectable()
export class FindRepairUseCase {
  constructor(
    @Inject(REPAIR_REPOSITORY)
    private readonly repairRepository: RepairRepository,
  ) {}

  async execute(input: FindRepairInputDto): Promise<FindRepairOutputDto> {
    const repair = await this.repairRepository.findById(input.id);

    if (!repair) {
      throw new RepairNotFoundError(input.id);
    }

    return {
      id: repair.id,
      description: repair.description,
      unitValue: repair.unitValue,
      createdAt: repair.createdAt,
      updatedAt: repair.updatedAt,
    };
  }
}
