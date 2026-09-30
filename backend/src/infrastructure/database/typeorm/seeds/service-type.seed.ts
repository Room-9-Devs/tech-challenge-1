import { Injectable, Inject, Logger } from '@nestjs/common';
import { ServiceType } from '@/domain/entities/service-type.entity';
import { ServiceTypeRepository } from '@/domain/repositories/service-type.repository';
import { SERVICE_TYPE_REPOSITORY } from '@/application/use-cases/service-types/create-service-type/create-service-type.use-case';

export const DEFAULT_SERVICE_TYPES = [
  { description: 'Troca de óleo', unitValue: 120.0 },
  { description: 'Alinhamento e balanceamento', unitValue: 180.0 },
  { description: 'Revisão completa', unitValue: 450.0 },
  { description: 'Troca de pastilhas de freio', unitValue: 220.0 },
  { description: 'Troca de discos de freio', unitValue: 350.0 },
  { description: 'Suspensão', unitValue: 280.0 },
  { description: 'Troca de amortecedores', unitValue: 520.0 },
  { description: 'Troca de correia dentada', unitValue: 410.0 },
  { description: 'Ar condicionado', unitValue: 190.0 },
  { description: 'Higienização interna', unitValue: 150.0 },
  { description: 'Troca de bateria', unitValue: 95.0 },
  { description: 'Troca de pneus', unitValue: 60.0 },
];

@Injectable()
export class ServiceTypeSeedService {
  private readonly logger = new Logger(ServiceTypeSeedService.name);

  constructor(
    @Inject(SERVICE_TYPE_REPOSITORY)
    private readonly serviceTypeRepository: ServiceTypeRepository,
  ) {}

  async run(): Promise<void> {
    const existingServiceTypes = await this.serviceTypeRepository.findAll();

    if (existingServiceTypes.length > 0) {
      this.logger.log('Service types already seeded. Skipping.');
      return;
    }

    for (const item of DEFAULT_SERVICE_TYPES) {
      const serviceType = ServiceType.create(item);
      await this.serviceTypeRepository.save(serviceType);
    }

    this.logger.log(
      `${DEFAULT_SERVICE_TYPES.length} service types seeded successfully.`,
    );
  }
}
