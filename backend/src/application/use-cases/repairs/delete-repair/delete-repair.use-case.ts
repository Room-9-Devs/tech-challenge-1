import { Injectable, Inject } from '@nestjs/common';
import { RepairRepository } from '@/domain/repositories/repair.repository';
import { RepairNotFoundError } from '@/domain/errors/repair-not-found.error';
import { REPAIR_REPOSITORY } from '../create-repair/create-repair.use-case';
import { DeleteRepairInputDto } from './delete-repair-input.dto';
import { DOMAIN_EVENT_PUBLISHER, DomainEventPublisher } from '@/application/ports/domain-event-publisher.port';
import { RepairDeletedEvent } from '@/domain/events/repair.events';

@Injectable()
export class DeleteRepairUseCase {
  constructor(
    @Inject(REPAIR_REPOSITORY)
    private readonly repairRepository: RepairRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async execute(input: DeleteRepairInputDto): Promise<void> {
    const repair = await this.repairRepository.findById(input.id);

    if (!repair) {
      throw new RepairNotFoundError(input.id);
    }

    await this.eventPublisher.publish(
      new RepairDeletedEvent(repair.id, {
        description: repair.description,
        unitValue: repair.unitValue,
      }),
    );

    await this.repairRepository.delete(input.id);
  }
}
