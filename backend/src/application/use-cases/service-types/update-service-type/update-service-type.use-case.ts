import { Injectable, Inject } from '@nestjs/common';
import { ServiceTypeRepository } from '@/domain/repositories/service-type.repository';
import { ServiceTypeNotFoundError } from '@/domain/errors/service-type-not-found.error';
import { ServiceTypeAlreadyExistsError } from '@/domain/errors/service-type-already-exists.error';
import { SERVICE_TYPE_REPOSITORY } from '../create-service-type/create-service-type.use-case';
import { UpdateServiceTypeInputDto } from './update-service-type-input.dto';
import { UpdateServiceTypeOutputDto } from './update-service-type-output.dto';

@Injectable()
export class UpdateServiceTypeUseCase {
  constructor(
    @Inject(SERVICE_TYPE_REPOSITORY)
    private readonly serviceTypeRepository: ServiceTypeRepository,
  ) {}

  async execute(input: UpdateServiceTypeInputDto): Promise<UpdateServiceTypeOutputDto> {
    const serviceType = await this.serviceTypeRepository.findById(input.id);

    if (!serviceType) {
      throw new ServiceTypeNotFoundError(input.id);
    }

    if (serviceType.description !== input.description) {
      const existingServiceType = await this.serviceTypeRepository.findByDescription(
        input.description,
      );

      if (existingServiceType) {
        throw new ServiceTypeAlreadyExistsError(input.description);
      }
    }

    serviceType.changeDescription(input.description);
    serviceType.changeUnitValue(input.unitValue);

    const updatedServiceType = await this.serviceTypeRepository.save(serviceType);

    return {
      id: updatedServiceType.id,
      description: updatedServiceType.description,
      unitValue: updatedServiceType.unitValue,
      createdAt: updatedServiceType.createdAt,
      updatedAt: updatedServiceType.updatedAt,
    };
  }
}
