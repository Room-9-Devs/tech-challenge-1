import { Injectable, Inject } from '@nestjs/common';
import { RepairRepository } from '@/domain/repositories/repair.repository';
import { RepairNotFoundError } from '@/domain/errors/repair-not-found.error';
import { RepairAlreadyExistsError } from '@/domain/errors/repair-already-exists.error';
import { REPAIR_REPOSITORY } from '../create-repair/create-repair.use-case';
import { UpdateRepairInputDto } from './update-repair-input.dto';
import { UpdateRepairOutputDto } from './update-repair-output.dto';

@Injectable()
export class UpdateRepairUseCase {
  constructor(
    @Inject(REPAIR_REPOSITORY)
    private readonly repairRepository: RepairRepository,
  ) {}

  async execute(input: UpdateRepairInputDto): Promise<UpdateRepairOutputDto> {
    const repair = await this.repairRepository.findById(input.id);

    if (!repair) {
      throw new RepairNotFoundError(input.id);
    }

    if (repair.description !== input.description) {
      const existingRepair = await this.repairRepository.findByDescription(
        input.description,
      );

      if (existingRepair) {
        throw new RepairAlreadyExistsError(input.description);
      }
    }

    repair.changeDescription(input.description);
    repair.changeUnitValue(input.unitValue);

    const updatedRepair = await this.repairRepository.save(repair);

    return {
      id: updatedRepair.id,
      description: updatedRepair.description,
      unitValue: updatedRepair.unitValue,
      createdAt: updatedRepair.createdAt,
      updatedAt: updatedRepair.updatedAt,
    };
  }
}
