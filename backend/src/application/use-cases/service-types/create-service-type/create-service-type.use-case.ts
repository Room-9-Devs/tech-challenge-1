import { Injectable, Inject } from '@nestjs/common';
import { ServiceType } from '@/domain/entities/service-type.entity';
import { ServiceTypeRepository } from '@/domain/repositories/service-type.repository';
import { ServiceTypeAlreadyExistsError } from '@/domain/errors/service-type-already-exists.error';
import { CreateServiceTypeInputDto } from './create-service-type-input.dto';
import { CreateServiceTypeOutputDto } from './create-service-type-output.dto';

export const SERVICE_TYPE_REPOSITORY = Symbol('SERVICE_TYPE_REPOSITORY');

@Injectable()
export class CreateServiceTypeUseCase {
  constructor(
    @Inject(SERVICE_TYPE_REPOSITORY)
    private readonly serviceTypeRepository: ServiceTypeRepository,
  ) {}

  async execute(input: CreateServiceTypeInputDto): Promise<CreateServiceTypeOutputDto> {
    const existingServiceType = await this.serviceTypeRepository.findByDescription(
      input.description,
    );

    if (existingServiceType) {
      throw new ServiceTypeAlreadyExistsError(input.description);
    }

    const serviceType = ServiceType.create({
      description: input.description,
      unitValue: input.unitValue,
    });

    const savedServiceType = await this.serviceTypeRepository.save(serviceType);

    return {
      id: savedServiceType.id,
      description: savedServiceType.description,
      unitValue: savedServiceType.unitValue,
      createdAt: savedServiceType.createdAt,
      updatedAt: savedServiceType.updatedAt,
    };
  }
}
