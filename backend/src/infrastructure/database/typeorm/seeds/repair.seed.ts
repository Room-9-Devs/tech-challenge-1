import { Injectable, Inject, Logger } from '@nestjs/common';
import { Repair } from '@/domain/entities/repair.entity';
import { RepairRepository } from '@/domain/repositories/repair.repository';
import { REPAIR_REPOSITORY } from '@/application/use-cases/repairs/create-repair/create-repair.use-case';

export const DEFAULT_REPAIRS = [
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
export class RepairSeedService {
  private readonly logger = new Logger(RepairSeedService.name);

  constructor(
    @Inject(REPAIR_REPOSITORY)
    private readonly repairRepository: RepairRepository,
  ) {}

  async run(): Promise<void> {
    const { data: existingRepairs } = await this.repairRepository.findAll();

    if (existingRepairs.length > 0) {
      this.logger.log('Tipos de reparo/serviço já semeados. Pulando.');
      return;
    }

    for (const item of DEFAULT_REPAIRS) {
      const repair = Repair.create(item);
      await this.repairRepository.save(repair);
    }

    this.logger.log(
      `${DEFAULT_REPAIRS.length} tipos de reparo/serviço semeados com sucesso.`,
    );
  }
}
