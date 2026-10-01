import { Injectable, Inject } from '@nestjs/common';
import { ServiceTypeRepository } from '@/domain/repositories/service-type.repository';
import { ServiceTypeNotFoundError } from '@/domain/errors/service-type-not-found.error';
import { SERVICE_TYPE_REPOSITORY } from '../create-service-type/create-service-type.use-case';
import { FindServiceTypeInputDto } from './find-service-type-input.dto';
import { FindServiceTypeOutputDto } from './find-service-type-output.dto';

@Injectable()
export class FindServiceTypeUseCase {
  constructor(
    @Inject(SERVICE_TYPE_REPOSITORY)
    private readonly serviceTypeRepository: ServiceTypeRepository,
  ) {}

  async execute(input: FindServiceTypeInputDto): Promise<FindServiceTypeOutputDto> {
    const serviceType = await this.serviceTypeRepository.findById(input.id);

    if (!serviceType) {
      throw new ServiceTypeNotFoundError(input.id);
    }

    return {
      id: serviceType.id,
      description: serviceType.description,
      unitValue: serviceType.unitValue,
      createdAt: serviceType.createdAt,
      updatedAt: serviceType.updatedAt,
    };
  }
}
