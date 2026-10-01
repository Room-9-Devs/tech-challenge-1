import { Injectable, Inject } from '@nestjs/common';
import { ServiceTypeRepository } from '@/domain/repositories/service-type.repository';
import { ServiceTypeNotFoundError } from '@/domain/errors/service-type-not-found.error';
import { SERVICE_TYPE_REPOSITORY } from '../create-service-type/create-service-type.use-case';
import { DeleteServiceTypeInputDto } from './delete-service-type-input.dto';

@Injectable()
export class DeleteServiceTypeUseCase {
  constructor(
    @Inject(SERVICE_TYPE_REPOSITORY)
    private readonly serviceTypeRepository: ServiceTypeRepository,
  ) {}

  async execute(input: DeleteServiceTypeInputDto): Promise<void> {
    const serviceType = await this.serviceTypeRepository.findById(input.id);

    if (!serviceType) {
      throw new ServiceTypeNotFoundError(input.id);
    }

    await this.serviceTypeRepository.delete(input.id);
  }
}
