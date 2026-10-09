import { Injectable, Inject } from '@nestjs/common';
import { RepairRepository } from '@/domain/repositories/repair.repository';
import { RepairNotFoundError } from '@/domain/errors/repair-not-found.error';
import { RepairAlreadyExistsError } from '@/domain/errors/repair-already-exists.error';
import { REPAIR_REPOSITORY } from '../create-repair/create-repair.use-case';
import { UpdateRepairInputDto } from './update-repair-input.dto';
import { UpdateRepairOutputDto } from './update-repair-output.dto';
import { DOMAIN_EVENT_PUBLISHER, DomainEventPublisher } from '@/application/ports/domain-event-publisher.port';
import { RepairUpdatedEvent } from '@/domain/events/repair.events';

@Injectable()
export class UpdateRepairUseCase {
  constructor(
    @Inject(REPAIR_REPOSITORY)
    private readonly repairRepository: RepairRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly eventPublisher: DomainEventPublisher,
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

    const oldValues = {
      description: repair.description,
      unitValue: repair.unitValue,
    };

    repair.changeDescription(input.description);
    repair.changeUnitValue(input.unitValue);

    const updatedRepair = await this.repairRepository.save(repair);

    await this.eventPublisher.publish(
      new RepairUpdatedEvent(updatedRepair.id, input.createdBy, {
        changedFields: Object.keys(input).filter((key) => key !== 'id' && key !== 'createdBy'),
        old: oldValues,
        new: {
          description: updatedRepair.description,
          unitValue: updatedRepair.unitValue,
        },
      }),
    );

    return {
      id: updatedRepair.id,
      description: updatedRepair.description,
      unitValue: updatedRepair.unitValue,
      createdAt: updatedRepair.createdAt,
      updatedAt: updatedRepair.updatedAt,
    };
  }
}
