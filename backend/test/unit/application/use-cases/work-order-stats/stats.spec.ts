import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import { WorkOrderStatsRecord } from '@/application/ports/work-order-stats.repository';
import { WORK_ORDER_STATS } from '@/application/use-cases/work-order-stats/get-work-order-stats/stats/work-order-stats.registry';
import { formatDuration } from '@/application/use-cases/work-order-stats/get-work-order-stats/stats/format-duration';

const START = new Date(2026, 2, 1); // 2026-03-01
const END = new Date(2026, 2, 11, 23, 59, 59, 999); // 2026-03-11 23:59

const context = (records: WorkOrderStatsRecord[]) => ({
  startInstant: START,
  endInstant: END,
  records,
});

const record = (
  id: string,
  createdAt: Date,
  transitions: Array<[WorkOrderStatus, Date]>,
): WorkOrderStatsRecord => ({
  id,
  createdAt,
  transitions: transitions.map(([status, at]) => ({ status, at })),
});

const stat = (tag: string) => {
  const found = WORK_ORDER_STATS.find((s) => s.tag === tag);
  if (!found) throw new Error(`stat ${tag} not registered`);
  return found;
};

describe('work order stats registry', () => {
  it('should register every expected tag exactly once', () => {
    const tags = WORK_ORDER_STATS.map((s) => s.tag);
    expect(tags).toEqual([
      'wo_started',
      'wo_completed',
      'wo_delivered',
      'wo_cancelled',
      'wo_approved',
      'wo_under_diagnosis',
      'wo_awaiting_approval',
      'wo_in_progress',
      'avg_time_from_received_to_under_diagnosis',
      'avg_time_from_under_diagnosis_to_awaiting_approval',
      'avg_time_from_awaiting_approval_to_approved',
      'avg_time_from_approved_to_in_progress',
      'avg_time_from_in_progress_to_completed',
      'avg_time_from_received',
      'avg_time_from_diagnosis',
      'avg_time_from_awaiting_approval',
      'avg_time_from_approved',
    ]);
    expect(new Set(tags).size).toBe(tags.length);
  });

  it('should expose name and hint for every stat', () => {
    for (const s of WORK_ORDER_STATS) {
      expect(s.name.length).toBeGreaterThan(0);
      expect(s.hint.length).toBeGreaterThan(0);
    }
  });
});

describe('wo_started', () => {
  const started = stat('wo_started');

  it('counts work orders created within the period', () => {
    const records = [
      record('a', new Date(2026, 1, 28), []), // antes do período
      record('b', new Date(2026, 2, 1, 0, 0, 0), []), // no início
      record('c', new Date(2026, 2, 11, 12), []), // dentro
      record('d', new Date(2026, 2, 15), []), // depois (não carregado em produção)
    ];
    expect(started.compute(context(records))).toBe('2'); // b e c
  });
});

describe('wo_completed', () => {
  const completed = stat('wo_completed');

  it('counts transitions to completed within the period', () => {
    const records = [
      record('a', new Date(2026, 1, 1), [
        [WorkOrderStatus.COMPLETED, new Date(2026, 2, 5)],
      ]),
      record('b', new Date(2026, 1, 1), [
        [WorkOrderStatus.COMPLETED, new Date(2026, 1, 20)], // antes do período
      ]),
      record('c', new Date(2026, 1, 1), [
        [WorkOrderStatus.COMPLETED, new Date(2026, 2, 8)],
        [WorkOrderStatus.DELIVERED, new Date(2026, 2, 9)],
      ]),
      record('d', new Date(2026, 1, 1), []), // nunca concluída
    ];
    expect(completed.compute(context(records))).toBe('2');
  });
});

describe('status snapshot stats', () => {
  it('uses the last known status at the end instant of the period', () => {
    const midPeriod = new Date(2026, 2, 5);
    const beforeEnd = new Date(2026, 2, 10);
    const records = [
      // Concluiu exatamente no último segundo do período
      record('a', new Date(2026, 1, 1), [
        [WorkOrderStatus.UNDER_DIAGNOSIS, midPeriod],
        [WorkOrderStatus.COMPLETED, new Date(2026, 2, 11, 23, 59, 59)],
      ]),
      record('b', new Date(2026, 1, 1), [
        [WorkOrderStatus.UNDER_DIAGNOSIS, midPeriod],
      ]),
      record('c', new Date(2026, 1, 1), [
        [WorkOrderStatus.AWAITING_APPROVAL, beforeEnd],
        [WorkOrderStatus.APPROVED, beforeEnd],
      ]),
      record('d', new Date(2026, 1, 1), [
        [WorkOrderStatus.AWAITING_APPROVAL, beforeEnd],
        [WorkOrderStatus.CANCELLED, beforeEnd],
      ]),
      record('e', new Date(2026, 1, 1), [
        [WorkOrderStatus.APPROVED, beforeEnd],
        [WorkOrderStatus.IN_PROGRESS, beforeEnd],
      ]),
      record('f', new Date(2026, 1, 1), [
        [WorkOrderStatus.IN_PROGRESS, beforeEnd],
        [WorkOrderStatus.COMPLETED, beforeEnd],
        [WorkOrderStatus.DELIVERED, beforeEnd],
      ]),
      record('g', new Date(2026, 1, 1), []), // status inicial received
      record('h', new Date(2026, 1, 1), [
        [WorkOrderStatus.AWAITING_APPROVAL, beforeEnd],
      ]),
    ];
    const ctx = context(records);

    expect(stat('wo_completed').compute(ctx)).toBe('2'); // a e f
    expect(stat('wo_delivered').compute(ctx)).toBe('1'); // f
    expect(stat('wo_cancelled').compute(ctx)).toBe('1'); // d
    expect(stat('wo_approved').compute(ctx)).toBe('1'); // c
    expect(stat('wo_under_diagnosis').compute(ctx)).toBe('1'); // b
    expect(stat('wo_awaiting_approval').compute(ctx)).toBe('1'); // h
    expect(stat('wo_in_progress').compute(ctx)).toBe('1'); // e
  });

  it('ignores transitions that happen after the end instant', () => {
    const afterEnd = new Date(2026, 2, 12);
    const records = [
      record('a', new Date(2026, 1, 1), [
        [WorkOrderStatus.UNDER_DIAGNOSIS, new Date(2026, 2, 2)],
        [WorkOrderStatus.COMPLETED, afterEnd],
      ]),
    ];
    const ctx = context(records);
    expect(stat('wo_under_diagnosis').compute(ctx)).toBe('1');
    expect(stat('wo_completed').compute(ctx)).toBe('0');
  });
});

describe('avg time between transitions stats', () => {
  it('computes the average from received to under_diagnosis', () => {
    const records = [
      record('a', new Date(2026, 2, 1), [
        [WorkOrderStatus.UNDER_DIAGNOSIS, new Date(2026, 2, 3)],
      ]),
      record('b', new Date(2026, 2, 1), [
        [WorkOrderStatus.UNDER_DIAGNOSIS, new Date(2026, 2, 5)],
      ]),
      record('c', new Date(2026, 2, 1), []), // sem diagnóstico: ignorada
    ];
    // 2 dias e 4 dias => média de 3 dias
    expect(
      stat('avg_time_from_received_to_under_diagnosis').compute(
        context(records),
      ),
    ).toBe('3d 0h 0m');
  });

  it('computes the average from under_diagnosis to awaiting_approval', () => {
    const records = [
      record('a', new Date(2026, 1, 1), [
        [WorkOrderStatus.UNDER_DIAGNOSIS, new Date(2026, 2, 1)],
        [WorkOrderStatus.AWAITING_APPROVAL, new Date(2026, 2, 3)],
      ]),
      record('b', new Date(2026, 1, 1), [
        [WorkOrderStatus.UNDER_DIAGNOSIS, new Date(2026, 2, 1)],
        [WorkOrderStatus.AWAITING_APPROVAL, new Date(2026, 2, 5)],
      ]),
    ];
    // 2 dias e 4 dias => média de 3 dias
    expect(
      stat('avg_time_from_under_diagnosis_to_awaiting_approval').compute(
        context(records),
      ),
    ).toBe('3d 0h 0m');
  });

  it('computes the average from awaiting_approval to approved', () => {
    const records = [
      record('a', new Date(2026, 1, 1), [
        [WorkOrderStatus.AWAITING_APPROVAL, new Date(2026, 2, 1)],
        [WorkOrderStatus.APPROVED, new Date(2026, 2, 3)],
      ]),
      record('b', new Date(2026, 1, 1), [
        [WorkOrderStatus.AWAITING_APPROVAL, new Date(2026, 2, 1)],
        [WorkOrderStatus.APPROVED, new Date(2026, 2, 6)],
      ]),
    ];
    // 2 dias e 5 dias => média de 3.5 dias = 3d 12h
    expect(
      stat('avg_time_from_awaiting_approval_to_approved').compute(
        context(records),
      ),
    ).toBe('3d 12h 0m');
  });

  it('computes the average from approved to in_progress', () => {
    const records = [
      record('a', new Date(2026, 1, 1), [
        [WorkOrderStatus.APPROVED, new Date(2026, 2, 1)],
        [WorkOrderStatus.IN_PROGRESS, new Date(2026, 2, 2)],
      ]),
      record('b', new Date(2026, 1, 1), [
        [WorkOrderStatus.APPROVED, new Date(2026, 2, 1)],
        [WorkOrderStatus.IN_PROGRESS, new Date(2026, 2, 4)],
      ]),
    ];
    // 1 dia e 3 dias => média de 2 dias
    expect(
      stat('avg_time_from_approved_to_in_progress').compute(context(records)),
    ).toBe('2d 0h 0m');
  });

  it('computes the average from in_progress to completed', () => {
    const records = [
      record('a', new Date(2026, 1, 1), [
        [WorkOrderStatus.IN_PROGRESS, new Date(2026, 2, 1)],
        [WorkOrderStatus.COMPLETED, new Date(2026, 2, 3)],
      ]),
      record('b', new Date(2026, 1, 1), [
        [WorkOrderStatus.IN_PROGRESS, new Date(2026, 2, 1)],
        [WorkOrderStatus.COMPLETED, new Date(2026, 2, 5)],
      ]),
    ];
    // 2 dias e 4 dias => média de 3 dias
    expect(
      stat('avg_time_from_in_progress_to_completed').compute(context(records)),
    ).toBe('3d 0h 0m');
  });

  it('ignores transitions to destination status that happen after the end instant', () => {
    const afterEnd = new Date(2026, 2, 12);
    const records = [
      record('a', new Date(2026, 2, 1), [
        [WorkOrderStatus.IN_PROGRESS, new Date(2026, 2, 2)],
        [WorkOrderStatus.COMPLETED, afterEnd],
      ]),
    ];
    const ctx = context(records);
    expect(stat('avg_time_from_in_progress_to_completed').compute(ctx)).toBe(
      'sem dados',
    );
  });

  it('returns "sem dados" when no record matches the transition pair', () => {
    expect(
      stat('avg_time_from_received_to_under_diagnosis').compute(context([])),
    ).toBe('sem dados');
    expect(
      stat('avg_time_from_in_progress_to_completed').compute(context([])),
    ).toBe('sem dados');
  });

  it('uses hours and minutes in the output format', () => {
    const records = [
      record('a', new Date(2026, 2, 1, 8, 30), [
        [WorkOrderStatus.IN_PROGRESS, new Date(2026, 2, 1, 8, 30)],
        [WorkOrderStatus.COMPLETED, new Date(2026, 2, 4, 21, 50)],
      ]),
    ];
    // 3d 13h 20m
    expect(
      stat('avg_time_from_in_progress_to_completed').compute(context(records)),
    ).toBe('3d 13h 20m');
  });
});

describe('avg completion time stats', () => {
  it('computes the average from received to completed', () => {
    // 2 dias exatos e 4 dias exatos => média de 3 dias
    const records = [
      record('a', new Date(2026, 2, 1), [
        [WorkOrderStatus.COMPLETED, new Date(2026, 2, 3)],
      ]),
      record('b', new Date(2026, 2, 1), [
        [WorkOrderStatus.COMPLETED, new Date(2026, 2, 5)],
      ]),
      record('c', new Date(2026, 2, 1), []), // não concluída: ignorada
    ];
    expect(stat('avg_time_from_received').compute(context(records))).toBe(
      '3d 0h 0m',
    );
  });

  it('computes the average from each milestone', () => {
    const records = [
      record('a', new Date(2026, 1, 1), [
        [WorkOrderStatus.UNDER_DIAGNOSIS, new Date(2026, 2, 1)],
        [WorkOrderStatus.AWAITING_APPROVAL, new Date(2026, 2, 2)],
        [WorkOrderStatus.APPROVED, new Date(2026, 2, 3)],
        [WorkOrderStatus.IN_PROGRESS, new Date(2026, 2, 4)],
        [WorkOrderStatus.COMPLETED, new Date(2026, 2, 5)],
      ]),
    ];
    const ctx = context(records);
    expect(stat('avg_time_from_diagnosis').compute(ctx)).toBe('4d 0h 0m');
    expect(stat('avg_time_from_awaiting_approval').compute(ctx)).toBe(
      '3d 0h 0m',
    );
    expect(stat('avg_time_from_approved').compute(ctx)).toBe('2d 0h 0m');
  });

  it('skips records without the milestone', () => {
    const records = [
      record('a', new Date(2026, 1, 1), [
        [WorkOrderStatus.APPROVED, new Date(2026, 2, 3)],
        [WorkOrderStatus.COMPLETED, new Date(2026, 2, 5)],
      ]),
      record('b', new Date(2026, 1, 1), [
        [WorkOrderStatus.COMPLETED, new Date(2026, 2, 4)],
      ]), // sem diagnóstico registrado
    ];
    expect(stat('avg_time_from_diagnosis').compute(context(records))).toBe(
      '0d 0h 0m',
    );
    expect(stat('avg_time_from_approved').compute(context(records))).toBe(
      '2d 0h 0m',
    );
  });

  it('returns zero when there are no completed records', () => {
    expect(stat('avg_time_from_received').compute(context([]))).toBe(
      '0d 0h 0m',
    );
  });

  it('uses hours and minutes in the output format', () => {
    const records = [
      record('a', new Date(2026, 2, 1, 8, 30), [
        [WorkOrderStatus.COMPLETED, new Date(2026, 2, 4, 21, 50)],
      ]),
    ];
    expect(stat('avg_time_from_received').compute(context(records))).toBe(
      '3d 13h 20m',
    );
  });
});

describe('formatDuration', () => {
  it('formats days, hours and minutes', () => {
    const ms = 3 * 86_400_000 + 13 * 3_600_000 + 20 * 60_000;
    expect(formatDuration(ms)).toBe('3d 13h 20m');
  });

  it('clamps negative values to zero', () => {
    expect(formatDuration(-1000)).toBe('0d 0h 0m');
  });

  it('formats zero', () => {
    expect(formatDuration(0)).toBe('0d 0h 0m');
  });
});
