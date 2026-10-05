import { Injectable, Inject } from '@nestjs/common';
import { Repair } from '@/domain/entities/repair.entity';
import { RepairRepository } from '@/domain/repositories/repair.repository';
import { RepairAlreadyExistsError } from '@/domain/errors/repair-already-exists.error';
import { CreateRepairInputDto } from './create-repair-input.dto';
import { CreateRepairOutputDto } from './create-repair-output.dto';

export const REPAIR_REPOSITORY = Symbol('REPAIR_REPOSITORY');

@Injectable()
export class CreateRepairUseCase {
  constructor(
    @Inject(REPAIR_REPOSITORY)
    private readonly repairRepository: RepairRepository,
  ) {}

  async execute(input: CreateRepairInputDto): Promise<CreateRepairOutputDto> {
    const existingRepair = await this.repairRepository.findByDescription(
      input.description,
    );

    if (existingRepair) {
      throw new RepairAlreadyExistsError(input.description);
    }

    const repair = Repair.create({
      description: input.description,
      unitValue: input.unitValue,
    });

    const savedRepair = await this.repairRepository.save(repair);

    return {
      id: savedRepair.id,
      description: savedRepair.description,
      unitValue: savedRepair.unitValue,
      createdAt: savedRepair.createdAt,
      updatedAt: savedRepair.updatedAt,
    };
  }
}
