import { Injectable, Inject, Logger } from '@nestjs/common';
import { EventType } from '@/domain/entities/event-type.entity';
import {
  EventTypeRepository,
  EVENT_TYPE_REPOSITORY,
} from '@/domain/repositories/event-type.repository';

export const DEFAULT_EVENT_TYPES = [
  {
    code: 'client.created',
    name: 'Cliente criado',
    allowedEntityTypes: ['client' as const],
  },
  {
    code: 'client.updated',
    name: 'Cliente atualizado',
    allowedEntityTypes: ['client' as const],
  },
  {
    code: 'employee.created',
    name: 'Funcionário criado',
    allowedEntityTypes: ['employee' as const],
  },
  {
    code: 'employee.updated',
    name: 'Funcionário atualizado',
    allowedEntityTypes: ['employee' as const],
  },
  {
    code: 'user.created',
    name: 'Usuário criado',
    allowedEntityTypes: ['user' as const],
  },
  {
    code: 'user.updated',
    name: 'Usuário atualizado',
    allowedEntityTypes: ['user' as const],
  },
  {
    code: 'user.password_changed',
    name: 'Senha alterada',
    allowedEntityTypes: ['user' as const],
  },
  {
    code: 'user.role_changed',
    name: 'Role alterada',
    allowedEntityTypes: ['user' as const],
  },
  {
    code: 'user.deleted',
    name: 'Usuário excluído',
    allowedEntityTypes: ['user' as const],
  },
  {
    code: 'vehicle.created',
    name: 'Veículo criado',
    allowedEntityTypes: ['vehicle' as const],
  },
  {
    code: 'vehicle.updated',
    name: 'Veículo atualizado',
    allowedEntityTypes: ['vehicle' as const],
  },
  {
    code: 'vehicle.associated_to_user',
    name: 'Veículo vinculado a usuário',
    allowedEntityTypes: ['vehicle' as const],
  },
  {
    code: 'vehicle.dissociated_from_user',
    name: 'Veículo desvinculado de usuário',
    allowedEntityTypes: ['vehicle' as const],
  },
  {
    code: 'vehicle.deleted',
    name: 'Veículo excluído',
    allowedEntityTypes: ['vehicle' as const],
  },
  {
    code: 'product.created',
    name: 'Produto criado',
    allowedEntityTypes: ['product' as const],
  },
  {
    code: 'product.updated',
    name: 'Produto atualizado',
    allowedEntityTypes: ['product' as const],
  },
  {
    code: 'product.price_changed',
    name: 'Preço alterado',
    allowedEntityTypes: ['product' as const],
  },
  {
    code: 'stock.adjusted',
    name: 'Estoque ajustado',
    allowedEntityTypes: ['stock' as const],
  },
  {
    code: 'stock.reserved',
    name: 'Estoque reservado',
    allowedEntityTypes: ['stock' as const],
  },
  {
    code: 'stock.consumed',
    name: 'Estoque consumido',
    allowedEntityTypes: ['stock' as const],
  },
  {
    code: 'stock.released',
    name: 'Estoque liberado',
    allowedEntityTypes: ['stock' as const],
  },
  {
    code: 'repair.created',
    name: 'Reparo criado',
    allowedEntityTypes: ['repair' as const],
  },
  {
    code: 'repair.updated',
    name: 'Reparo atualizado',
    allowedEntityTypes: ['repair' as const],
  },
  {
    code: 'repair.deleted',
    name: 'Reparo removido',
    allowedEntityTypes: ['repair' as const],
  },
  {
    code: 'work_order.created',
    name: 'Ordem de serviço criada',
    allowedEntityTypes: ['work_order' as const],
  },
  {
    code: 'work_order.status_changed',
    name: 'Status da ordem de serviço alterado',
    allowedEntityTypes: ['work_order' as const],
  },
  {
    code: 'work_order.payment_confirmed',
    name: 'Pagamento da ordem de serviço confirmado',
    allowedEntityTypes: ['work_order' as const],
  },
  {
    code: 'work_order.item_added',
    name: 'Item adicionado à ordem de serviço',
    allowedEntityTypes: ['work_order' as const],
  },
  {
    code: 'work_order.item_quantity_changed',
    name: 'Quantidade de item da ordem de serviço alterada',
    allowedEntityTypes: ['work_order' as const],
  },
  {
    code: 'work_order.item_removed',
    name: 'Item removido da ordem de serviço',
    allowedEntityTypes: ['work_order' as const],
  },
  {
    code: 'auth.login.succeeded',
    name: 'Login bem-sucedido',
    allowedEntityTypes: ['user' as const],
  },
  {
    code: 'auth.login.failed',
    name: 'Login falho',
    allowedEntityTypes: ['user' as const],
  },
  {
    code: 'auth.logout.succeeded',
    name: 'Logout realizado',
    allowedEntityTypes: ['user' as const],
  },
];

@Injectable()
export class EventTypeSeedService {
  private readonly logger = new Logger(EventTypeSeedService.name);

  constructor(
    @Inject(EVENT_TYPE_REPOSITORY)
    private readonly eventTypeRepository: EventTypeRepository,
  ) {}

  async run(): Promise<void> {
    let seededCount = 0;

    for (const data of DEFAULT_EVENT_TYPES) {
      const existingEventType = await this.eventTypeRepository.findByCode(
        data.code,
      );

      if (existingEventType) {
        continue;
      }

      await this.eventTypeRepository.save(EventType.create(data));
      seededCount++;
    }

    if (seededCount === 0) {
      this.logger.log('Tipos de evento já semeados. Pulando.');
      return;
    }

    this.logger.log(`${seededCount} tipos de evento semeados com sucesso.`);
  }
}
