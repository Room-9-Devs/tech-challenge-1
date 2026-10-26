import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import { WorkOrderStatsRecord } from '@/application/ports/work-order-stats.repository';
import {
  buildWorkOrderCurrentStatus,
  buildWorkOrderStages,
  buildWorkOrderTotal,
} from '@/application/use-cases/work-order-stats/get-work-order-stats-detail/stages';

const NOW = new Date(2026, 2, 11, 12, 0, 0); // 2026-03-11 12:00

const at = (daysAgo: number): Date =>
  new Date(NOW.getTime() - daysAgo * 86_400_000);

const record = (
  createdAt: Date,
  transitions: Array<[WorkOrderStatus, Date]>,
): WorkOrderStatsRecord => ({
  id: 'wo-1',
  createdAt,
  transitions: transitions.map(([status, atInstant]) => ({ status, at: atInstant })),
});

const globalStats = {
  avg_time_from_received_to_under_diagnosis: { value: '10d 0h 0m' },
  avg_time_from_under_diagnosis_to_awaiting_approval: { value: '5d 0h 0m' },
  avg_time_from_awaiting_approval_to_approved: { value: '2d 0h 0m' },
  avg_time_from_approved_to_in_progress: { value: '1d 0h 0m' },
  avg_time_from_in_progress_to_completed: { value: '3d 0h 0m' },
  avg_time_from_received: { value: '20d 0h 0m' },
};

describe('buildWorkOrderStages', () => {
  it('computes closed stage durations for a delivered work order', () => {
    // A: criada há 90d; diag 70d; orçamento 60d; aprovado 45d; execução 30d;
    // concluído 5d; entregue 2d
    const delivered = record(at(90), [
      [WorkOrderStatus.UNDER_DIAGNOSIS, at(70)],
      [WorkOrderStatus.AWAITING_APPROVAL, at(60)],
      [WorkOrderStatus.APPROVED, at(45)],
      [WorkOrderStatus.IN_PROGRESS, at(30)],
      [WorkOrderStatus.COMPLETED, at(5)],
      [WorkOrderStatus.DELIVERED, at(2)],
    ]);

    const stages = buildWorkOrderStages(delivered, globalStats, NOW);

    expect(stages.map((s) => s.tag)).toEqual([
      WorkOrderStatus.UNDER_DIAGNOSIS,
      WorkOrderStatus.AWAITING_APPROVAL,
      WorkOrderStatus.APPROVED,
      WorkOrderStatus.IN_PROGRESS,
      WorkOrderStatus.COMPLETED,
      WorkOrderStatus.DELIVERED,
    ]);
    expect(stages[0].duration).toBe('20d 0h 0m');
    expect(stages[1].duration).toBe('10d 0h 0m');
    expect(stages[2].duration).toBe('15d 0h 0m');
    expect(stages[3].duration).toBe('15d 0h 0m');
    expect(stages[4].duration).toBe('25d 0h 0m');
    expect(stages[5].duration).toBe('3d 0h 0m');

    for (const stage of stages) {
      expect(stage.pendingDuration).toBeNull();
      expect(stage.startedAt).not.toBeNull();
      expect(stage.endedAt).not.toBeNull();
    }
  });

  it('pairs each stage with its global average and leaves delivery without a pair', () => {
    const delivered = record(at(90), [
      [WorkOrderStatus.UNDER_DIAGNOSIS, at(70)],
      [WorkOrderStatus.AWAITING_APPROVAL, at(60)],
      [WorkOrderStatus.APPROVED, at(45)],
      [WorkOrderStatus.IN_PROGRESS, at(30)],
      [WorkOrderStatus.COMPLETED, at(5)],
      [WorkOrderStatus.DELIVERED, at(2)],
    ]);

    const stages = buildWorkOrderStages(delivered, globalStats, NOW);

    expect(stages[0].global).toEqual({
      tag: 'avg_time_from_received_to_under_diagnosis',
      value: '10d 0h 0m',
    });
    expect(stages[4].global).toEqual({
      tag: 'avg_time_from_in_progress_to_completed',
      value: '3d 0h 0m',
    });
    expect(stages[5].global).toBeNull();
  });

  it('computes pending durations for an in-flight work order', () => {
    // B: criada há 60d; diag 55d; orçamento 40d; aprovado 20d; em execução 10d
    // (sem conclusão)
    const inProgress = record(at(60), [
      [WorkOrderStatus.UNDER_DIAGNOSIS, at(55)],
      [WorkOrderStatus.AWAITING_APPROVAL, at(40)],
      [WorkOrderStatus.APPROVED, at(20)],
      [WorkOrderStatus.IN_PROGRESS, at(10)],
    ]);

    const stages = buildWorkOrderStages(inProgress, globalStats, NOW);

    // Etapas fechadas
    expect(stages[0].duration).toBe('5d 0h 0m');
    expect(stages[1].duration).toBe('15d 0h 0m');
    expect(stages[2].duration).toBe('20d 0h 0m');
    expect(stages[3].duration).toBe('10d 0h 0m');
    expect(stages[3].pendingDuration).toBeNull();

    // Etapa corrente ("execução do serviço") aberta desde a entrada em execução
    expect(stages[4].endedAt).toBeNull();
    expect(stages[4].pendingDuration).toBe('10d 0h 0m');
    expect(stages[4].duration).toBeNull();

    // Etapas ainda não alcançadas
    expect(stages[5].startedAt).toBeNull();
    expect(stages[5].duration).toBeNull();
    expect(stages[5].pendingDuration).toBeNull();
  });

  it('keeps the pending duration of the open stage for a received work order', () => {
    // C: criada há 15d, nenhuma transição
    const received = record(at(15), []);

    const stages = buildWorkOrderStages(received, globalStats, NOW);

    expect(stages[0].startedAt).toEqual(received.createdAt);
    expect(stages[0].endedAt).toBeNull();
    expect(stages[0].pendingDuration).toBe('15d 0h 0m');
    expect(stages[0].duration).toBeNull();
    for (const stage of stages.slice(1)) {
      expect(stage.startedAt).toBeNull();
      expect(stage.pendingDuration).toBeNull();
    }
  });

  it('does not show pending durations for a cancelled work order', () => {
    // E: criada há 45d; diag 40d; orçamento 35d; cancelada 30d
    const cancelled = record(at(45), [
      [WorkOrderStatus.UNDER_DIAGNOSIS, at(40)],
      [WorkOrderStatus.AWAITING_APPROVAL, at(35)],
      [WorkOrderStatus.CANCELLED, at(30)],
    ]);

    const stages = buildWorkOrderStages(cancelled, globalStats, NOW);

    expect(stages[0].duration).toBe('5d 0h 0m');
    expect(stages[1].duration).toBe('5d 0h 0m');
    // Etapas não realizadas: sem durações nem pendências (OS terminada)
    for (const stage of stages.slice(2)) {
      expect(stage.duration).toBeNull();
      expect(stage.pendingDuration).toBeNull();
    }
    expect(stages[0].pendingDuration).toBeNull();
    expect(stages[1].pendingDuration).toBeNull();
  });

  it('falls back to null when the global stat has no value', () => {
    const delivered = record(at(90), [
      [WorkOrderStatus.UNDER_DIAGNOSIS, at(70)],
    ]);

    const stages = buildWorkOrderStages(delivered, {}, NOW);

    expect(stages[0].global).toEqual({
      tag: 'avg_time_from_received_to_under_diagnosis',
      value: null,
    });
  });
});

describe('buildWorkOrderTotal', () => {
  it('computes the closed total for a completed work order', () => {
    const completed = record(at(60), [
      [WorkOrderStatus.COMPLETED, at(3)],
    ]);

    const total = buildWorkOrderTotal(completed, globalStats, NOW);

    expect(total.duration).toBe('57d 0h 0m');
    expect(total.pendingDuration).toBeNull();
    expect(total.global).toEqual({
      tag: 'avg_time_from_received',
      value: '20d 0h 0m',
    });
  });

  it('computes a pending total for an open work order', () => {
    const open = record(at(30), []);

    const total = buildWorkOrderTotal(open, globalStats, NOW);

    expect(total.duration).toBeNull();
    expect(total.pendingDuration).toBe('30d 0h 0m');
  });

  it('shows neither duration for a cancelled work order', () => {
    const cancelled = record(at(45), [
      [WorkOrderStatus.UNDER_DIAGNOSIS, at(40)],
      [WorkOrderStatus.CANCELLED, at(30)],
    ]);

    const total = buildWorkOrderTotal(cancelled, globalStats, NOW);

    expect(total.duration).toBeNull();
    expect(total.pendingDuration).toBeNull();
  });
});

describe('buildWorkOrderCurrentStatus', () => {
  it('uses the creation instant when there is no transition', () => {
    const received = record(at(5), []);

    const current = buildWorkOrderCurrentStatus(received, NOW);

    expect(current.status).toBe(WorkOrderStatus.RECEIVED);
    expect(current.since).toEqual(received.createdAt);
    expect(current.duration).toBe('5d 0h 0m');
  });

  it('uses the last transition instant before now', () => {
    const awaiting = record(at(60), [
      [WorkOrderStatus.UNDER_DIAGNOSIS, at(40)],
      [WorkOrderStatus.AWAITING_APPROVAL, at(7)],
    ]);

    const current = buildWorkOrderCurrentStatus(awaiting, NOW);

    expect(current.status).toBe(WorkOrderStatus.AWAITING_APPROVAL);
    expect(current.since).toEqual(at(7));
    expect(current.duration).toBe('7d 0h 0m');
  });
});
