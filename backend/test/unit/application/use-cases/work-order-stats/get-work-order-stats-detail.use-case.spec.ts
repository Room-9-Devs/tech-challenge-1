import {
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  PaginatedOutput,
} from '@/shared/pagination/pagination.types';
import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import { WorkOrder } from '@/domain/entities/work-order.entity';
import {
  WorkOrderQuery,
  WorkOrderRepository,
} from '@/domain/repositories/work-order.repository';
import {
  WorkOrderStatsRecord,
  WorkOrderStatsRepository,
} from '@/application/ports/work-order-stats.repository';
import { GetWorkOrderStatsDetailUseCase } from '@/application/use-cases/work-order-stats/get-work-order-stats-detail/get-work-order-stats-detail.use-case';
import { GetWorkOrderStatsUseCase } from '@/application/use-cases/work-order-stats/get-work-order-stats/get-work-order-stats.use-case';

const NOW = new Date(2026, 2, 11, 12, 0, 0); // 2026-03-11 12:00

class FakeWorkOrderRepository implements WorkOrderRepository {
  constructor(public order: WorkOrder | null) {}

  findById(): Promise<WorkOrder | null> {
    return Promise.resolve(this.order);
  }

  async save(workOrder: WorkOrder): Promise<WorkOrder> {
    return workOrder;
  }

  async findAll(query: WorkOrderQuery): Promise<PaginatedOutput<WorkOrder>> {
    void query;
    return {
      data: this.order ? [this.order] : [],
      meta: { page: 1, limit: 10, totalItems: this.order ? 1 : 0, totalPages: 1 },
    };
  }

  async deleteItem(workOrderId: string, itemId: string): Promise<void> {
    void workOrderId;
    void itemId;
  }
}

class FakeWorkOrderStatsRepository implements WorkOrderStatsRepository {
  constructor(public record: WorkOrderStatsRecord | null) {}

  findRecordsCreatedUntil(): Promise<WorkOrderStatsRecord[]> {
    return Promise.resolve(this.record ? [this.record] : []);
  }

  findRecordById(): Promise<WorkOrderStatsRecord | null> {
    return Promise.resolve(this.record);
  }
}

// Work orders do cenário, com as mesmas durações tanto na entidade (flags de
// trabalho) quanto no registro de estatísticas (transições de eventos).
const workOrder = (clientId: string, status: WorkOrderStatus): WorkOrder =>
  WorkOrder.create({
    number: 'OS-0001/2026',
    status,
    vehicleId: 'vehicle-1',
    clientId,
    createdBy: 'jose.silveira',
    createdAt: new Date(2026, 1, 10),
  });

const recordFor = (createdAt: Date, transitions: Array<[WorkOrderStatus, Date]>): WorkOrderStatsRecord => ({
  id: 'wo-1',
  createdAt,
  transitions: transitions.map(([status, at]) => ({ status, at })),
});

describe('GetWorkOrderStatsDetailUseCase', () => {
  const makeUseCase = (order: WorkOrder | null, record: WorkOrderStatsRecord | null) =>
    new GetWorkOrderStatsDetailUseCase(
      new FakeWorkOrderRepository(order),
      new FakeWorkOrderStatsRepository(record),
      new GetWorkOrderStatsUseCase(new FakeWorkOrderStatsRepository(record)),
    );

  it('should build stages, total and current status for a delivered work order', async () => {
    const order = workOrder('client-1', WorkOrderStatus.DELIVERED);
    const record = recordFor(new Date(2026, 1, 10), [
      [WorkOrderStatus.UNDER_DIAGNOSIS, new Date(2026, 1, 11)],
      [WorkOrderStatus.AWAITING_APPROVAL, new Date(2026, 1, 12)],
      [WorkOrderStatus.APPROVED, new Date(2026, 1, 13)],
      [WorkOrderStatus.IN_PROGRESS, new Date(2026, 1, 14)],
      [WorkOrderStatus.COMPLETED, new Date(2026, 1, 15)],
      [WorkOrderStatus.DELIVERED, new Date(2026, 1, 16)],
    ]);
    const useCase = makeUseCase(order, record);

    const result = await useCase.execute(
      { id: 'wo-1', actor: { id: 'jose', entityType: 'employee' } },
      NOW,
    );

    expect(result).toMatchObject({
      id: order.id,
      number: 'OS-0001/2026',
      status: WorkOrderStatus.DELIVERED,
      createdAt: new Date(2026, 1, 10),
    });
    expect(result.stages).toHaveLength(6);
    expect(result.stages[0].duration).toBe('1d 0h 0m');
    expect(result.stages[5].duration).toBe('1d 0h 0m');
    expect(result.total.duration).toBe('5d 0h 0m'); // criação 10/02 → conclusão 15/02
    expect(result.total.global.tag).toBe('avg_time_from_received');
    expect(result.currentStatus.status).toBe(WorkOrderStatus.DELIVERED);
  });

  it('should show a pending duration for the stage an open work order is in', async () => {
    const order = workOrder('client-1', WorkOrderStatus.AWAITING_APPROVAL);
    const record = recordFor(new Date(2026, 1, 10), [
      [WorkOrderStatus.UNDER_DIAGNOSIS, new Date(2026, 1, 11)],
      [WorkOrderStatus.AWAITING_APPROVAL, new Date(2026, 1, 12)],
    ]);
    const useCase = makeUseCase(order, record);

    const result = await useCase.execute(
      { id: 'wo-1', actor: { id: 'jose', entityType: 'employee' } },
      NOW,
    );

    expect(result.stages[0].duration).toBe('1d 0h 0m');
    expect(result.stages[1].duration).toBe('1d 0h 0m');
    // Etapa corrente "aguardando aprovação" (decisão do cliente): iniciada no
    // envio do orçamento e aberta até a decisão
    expect(result.stages[2].endedAt).toBeNull();
    expect(result.stages[2].pendingDuration).not.toBeNull();
    expect(result.total.pendingDuration).not.toBeNull();
    expect(result.total.duration).toBeNull();
    expect(result.currentStatus.status).toBe(WorkOrderStatus.AWAITING_APPROVAL);
  });

  it('should not show pending durations for a cancelled work order', async () => {
    const order = workOrder('client-1', WorkOrderStatus.CANCELLED);
    const record = recordFor(new Date(2026, 1, 10), [
      [WorkOrderStatus.UNDER_DIAGNOSIS, new Date(2026, 1, 11)],
      [WorkOrderStatus.AWAITING_APPROVAL, new Date(2026, 1, 12)],
      [WorkOrderStatus.CANCELLED, new Date(2026, 1, 13)],
    ]);
    const useCase = makeUseCase(order, record);

    const result = await useCase.execute(
      { id: 'wo-1', actor: { id: 'jose', entityType: 'employee' } },
      NOW,
    );

    expect(result.stages[2].duration).toBeNull();
    expect(result.stages[2].pendingDuration).toBeNull();
    expect(result.total.duration).toBeNull();
    expect(result.total.pendingDuration).toBeNull();
  });

  it('should feed every stage with the global averages of period=all', async () => {
    const order = workOrder('client-1', WorkOrderStatus.DELIVERED);
    const record = recordFor(new Date(2026, 1, 10), [
      [WorkOrderStatus.UNDER_DIAGNOSIS, new Date(2026, 1, 11)],
      [WorkOrderStatus.AWAITING_APPROVAL, new Date(2026, 1, 12)],
      [WorkOrderStatus.APPROVED, new Date(2026, 1, 13)],
      [WorkOrderStatus.IN_PROGRESS, new Date(2026, 1, 14)],
      [WorkOrderStatus.COMPLETED, new Date(2026, 1, 15)],
      [WorkOrderStatus.DELIVERED, new Date(2026, 1, 16)],
    ]);
    const useCase = makeUseCase(order, record);

    const result = await useCase.execute(
      { id: 'wo-1', actor: { id: 'jose', entityType: 'employee' } },
      NOW,
    );

    expect(result.stages[0].global?.tag).toBe(
      'avg_time_from_received_to_under_diagnosis',
    );
    expect(result.stages[0].global?.value).not.toBeNull();
    // A média de entrega compledata não tem par global
    expect(result.stages[5].global).toBeNull();
  });

  it('should reject a missing work order', async () => {
    const useCase = makeUseCase(null, null);

    await expect(
      useCase.execute(
        { id: 'wo-missing', actor: { id: 'jose', entityType: 'employee' } },
        NOW,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it('should block a client from another owner\'s work order', async () => {
    const order = workOrder('client-1', WorkOrderStatus.RECEIVED);
    const useCase = makeUseCase(order, recordFor(new Date(2026, 1, 10), []));

    await expect(
      useCase.execute(
        { id: 'wo-1', actor: { id: 'client-2', entityType: 'client' } },
        NOW,
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should allow the owning client to consult the work order', async () => {
    const order = workOrder('client-1', WorkOrderStatus.RECEIVED);
    const useCase = makeUseCase(order, recordFor(new Date(2026, 1, 10), []));

    const result = await useCase.execute(
      { id: 'wo-1', actor: { id: 'client-1', entityType: 'client' } },
      NOW,
    );

    expect(result.id).toBe(order.id);
  });
});
