import { Injectable, Inject } from '@nestjs/common';
import { ServiceTypeRepository } from '@/domain/repositories/service-type.repository';
import { SERVICE_TYPE_REPOSITORY } from '../create-service-type/create-service-type.use-case';
import { ListServiceTypesOutputDto } from './list-service-types-output.dto';

@Injectable()
export class ListServiceTypesUseCase {
  constructor(
    @Inject(SERVICE_TYPE_REPOSITORY)
    private readonly serviceTypeRepository: ServiceTypeRepository,
  ) {}

  async execute(): Promise<ListServiceTypesOutputDto> {
    const serviceTypes = await this.serviceTypeRepository.findAll();

    return {
      serviceTypes: serviceTypes.map((serviceType) => ({
        id: serviceType.id,
        description: serviceType.description,
        unitValue: serviceType.unitValue,
        createdAt: serviceType.createdAt,
        updatedAt: serviceType.updatedAt,
      })),
    };
  }
}
