import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { DomainEvent } from '@/domain/events/domain-event';
import { DomainEventPublisher } from '@/application/ports/domain-event-publisher.port';
import { EventRecorderService } from '@/application/services/event-recorder.service';
import { ProfileRepository } from '@/application/ports/profile.repository';
import { CreateWorkOrderUseCase } from '@/application/use-cases/work-orders/create-work-order/create-work-order.use-case';
import { AddWorkOrderItemUseCase } from '@/application/use-cases/work-orders/add-work-order-item/add-work-order-item.use-case';
import { ChangeWorkOrderStatusUseCase } from '@/application/use-cases/work-orders/change-work-order-status/change-work-order-status.use-case';
import { ConfirmWorkOrderPaymentUseCase } from '@/application/use-cases/work-orders/confirm-work-order-payment/confirm-work-order-payment.use-case';
import { ListWorkOrdersUseCase } from '@/application/use-cases/work-orders/list-work-orders/list-work-orders.use-case';
import { FindWorkOrderUseCase } from '@/application/use-cases/work-orders/find-work-order/find-work-order.use-case';
import { WorkOrderActorDto } from '@/application/use-cases/work-orders/work-order-actor.dto';
import { TypeOrmVehicleRepository } from '@/infrastructure/database/typeorm/repositories/typeorm-vehicle.repository';
import { TypeOrmWorkOrderRepository } from '@/infrastructure/database/typeorm/repositories/typeorm-work-order.repository';
import { TypeOrmUserRepository } from '@/infrastructure/database/typeorm/repositories/typeorm-user.repository';
import { TypeOrmEventTypeRepository } from '@/infrastructure/database/typeorm/repositories/typeorm-event-type.repository';
import { TypeOrmEventRepository } from '@/infrastructure/database/typeorm/repositories/typeorm-event.repository';
import { TypeOrmWorkOrderUnitOfWork } from '@/infrastructure/database/typeorm/typeorm-work-order-unit-of-work';
import { TypeOrmWorkOrderNumberGenerator } from '@/infrastructure/database/typeorm/services/typeorm-work-order-number-generator';
import { VehicleOrmEntity } from '@/infrastructure/database/typeorm/entities/vehicle.orm-entity';
import { WorkOrderOrmEntity } from '@/infrastructure/database/typeorm/entities/work-order.orm-entity';
import { WorkOrderItemOrmEntity } from '@/infrastructure/database/typeorm/entities/work-order-item.orm-entity';
import { UserOrmEntity } from '@/infrastructure/database/typeorm/entities/user.orm-entity';
import { EventTypeOrmEntity } from '@/infrastructure/database/typeorm/entities/event-type.orm-entity';
import { EventOrmEntity } from '@/infrastructure/database/typeorm/entities/event.orm-entity';

export class PersistingEventPublisher implements DomainEventPublisher {
  constructor(private readonly recorder: EventRecorderService) {}

  async publish(event: DomainEvent): Promise<void> {
    const payload = event as DomainEvent & {
      entityId: string;
      createdBy?: string;
      note?: unknown;
      metadata?: unknown;
    };
    await this.recorder.record({
      eventTypeCode: payload.eventType,
      entityType: 'work_order',
      entityId: payload.entityId,
      createdBy: payload.createdBy ?? null,
      note:
        'note' in payload && typeof payload.note === 'string'
          ? payload.note
          : null,
      metadata:
        payload.metadata && typeof payload.metadata === 'object'
          ? (payload.metadata as Record<string, unknown>)
          : null,
    });
  }
}

const fakeProfiles: ProfileRepository = {
  findById: async () => null,
  createClient: async () => {
    throw new Error('Profile repository is not used by this spec');
  },
  createEmployee: async () => {
    throw new Error('Profile repository is not used by this spec');
  },
  update: async () => null,
};

export interface Workshop {
  clientRoleId: string;
  staffUserId: string;
  clientUserId: string;
  vehicleId: string;
  repairId: string;
  productId: string;
  stockId: string;
  staff: WorkOrderActorDto;
  client: WorkOrderActorDto;
  createWorkOrder: CreateWorkOrderUseCase;
  addItem: AddWorkOrderItemUseCase;
  changeStatus: ChangeWorkOrderStatusUseCase;
  confirmPayment: ConfirmWorkOrderPaymentUseCase;
  listWorkOrders: ListWorkOrdersUseCase;
  findWorkOrder: FindWorkOrderUseCase;
}

export async function buildWorkshop(database: DataSource): Promise<Workshop> {
  await database.query(`
    INSERT INTO event_types (code, name, allowed_entity_types) VALUES
      ('stock.consumed', 'Estoque consumido', ARRAY['stock']::event_entity_type[]),
      ('work_order.created', 'Ordem de serviço criada', ARRAY['work_order']::event_entity_type[]),
      ('work_order.status_changed', 'Status da ordem de serviço alterado', ARRAY['work_order']::event_entity_type[]),
      ('work_order.payment_confirmed', 'Pagamento da ordem de serviço confirmado', ARRAY['work_order']::event_entity_type[]),
      ('work_order.item_added', 'Item adicionado à ordem de serviço', ARRAY['work_order']::event_entity_type[])
    ON CONFLICT (code) DO NOTHING
  `);

  const staffRoleId = randomUUID();
  const clientRoleId = randomUUID();
  const employeeId = randomUUID();
  const clientId = randomUUID();
  const staffUserId = randomUUID();
  const clientUserId = randomUUID();
  const vehicleId = randomUUID();
  const repairId = randomUUID();
  const productId = randomUUID();
  const stockId = randomUUID();

  await database.query(
    `INSERT INTO roles (id, name, slug) VALUES
      ($1, 'Staff', 'staff'),
      ($2, 'Client', 'client')`,
    [staffRoleId, clientRoleId],
  );

  await database.query(
    `INSERT INTO employees (id, name, document_type, document, phone, job_title)
    VALUES ($1, 'Atendente', 'CPF', '39053344705', '11987654321', NULL)`,
    [employeeId],
  );

  await database.query(
    `INSERT INTO clients (id, name, document_type, document, phone)
    VALUES ($1, 'Cliente', 'CPF', '52998224725', '11987654322')`,
    [clientId],
  );

  await database.query(
    `INSERT INTO users (id, username, email, password, entity_type, entity_id, role_id)
    VALUES
      ($1, 'atendente', 'atendente@example.com', 'test-hash', 'employee', $2, $3),
      ($4, 'cliente', 'cliente@example.com', 'test-hash', 'client', $5, $6)`,
    [staffUserId, employeeId, staffRoleId, clientUserId, clientId, clientRoleId],
  );

  await database.query(
    `INSERT INTO vehicles (id, license_plate, brand, model, year, color, user_id)
    VALUES ($1, 'ABC1D23', 'Chevrolet', 'Onix', 2020, 'Prata', $2)`,
    [vehicleId, clientUserId],
  );

  await database.query(
    `INSERT INTO repairs (id, description, unit_value)
    VALUES ($1, 'Troca de oleo', 150.00)`,
    [repairId],
  );

  await database.query(
    `INSERT INTO products (id, sku, name, product_type, unit, cost, sale_price, active)
    VALUES ($1, 'FILTRO-01', 'Filtro de oleo', 'PART', 'UNIT', 20.00, 40.00, true)`,
    [productId],
  );

  await database.query(
    `INSERT INTO stocks (id, product_id, quantity, reserved)
    VALUES ($1, $2, 5, 0)`,
    [stockId, productId],
  );

  const vehicles = new TypeOrmVehicleRepository(
    database.getRepository(VehicleOrmEntity),
  );
  const workOrders = new TypeOrmWorkOrderRepository(
    database.getRepository(WorkOrderOrmEntity),
    database.getRepository(WorkOrderItemOrmEntity),
  );
  const uow = new TypeOrmWorkOrderUnitOfWork(database);
  const numbers = new TypeOrmWorkOrderNumberGenerator(database);
  const publisher = new PersistingEventPublisher(
    new EventRecorderService(
      new TypeOrmEventTypeRepository(database.getRepository(EventTypeOrmEntity)),
      new TypeOrmEventRepository(database.getRepository(EventOrmEntity)),
    ),
  );

  return {
    clientRoleId,
    staffUserId,
    clientUserId,
    vehicleId,
    repairId,
    productId,
    stockId,
    staff: { id: staffUserId, username: 'atendente', entityType: 'employee' },
    client: { id: clientUserId, username: 'cliente', entityType: 'client' },
    createWorkOrder: new CreateWorkOrderUseCase(vehicles, uow, numbers, publisher),
    addItem: new AddWorkOrderItemUseCase(uow, publisher),
    changeStatus: new ChangeWorkOrderStatusUseCase(workOrders, uow, publisher),
    confirmPayment: new ConfirmWorkOrderPaymentUseCase(uow, publisher),
    listWorkOrders: new ListWorkOrdersUseCase(workOrders),
    findWorkOrder: new FindWorkOrderUseCase(
      workOrders,
      vehicles,
      new TypeOrmUserRepository(database.getRepository(UserOrmEntity)),
      fakeProfiles,
    ),
  };
}
