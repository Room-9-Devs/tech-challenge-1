import { InvalidWorkOrderStatsFilterError } from '@/domain/errors/invalid-work-order-stats-filter.error';
import { GetWorkOrderStatsUseCase } from '@/application/use-cases/work-order-stats/get-work-order-stats/get-work-order-stats.use-case';
import {
  WORK_ORDER_STATS_REPOSITORY,
  WorkOrderStatsRecord,
  WorkOrderStatsRepository,
} from '@/application/ports/work-order-stats.repository';
import { WORK_ORDER_STATS } from '@/application/use-cases/work-order-stats/get-work-order-stats/stats/work-order-stats.registry';

// Data fixa para testes determinísticos: 2026-03-11
const NOW = new Date(2026, 2, 11, 15, 30, 0);

class FakeWorkOrderStatsRepository implements WorkOrderStatsRepository {
  public requestedUntil: Date | null = null;

  constructor(private readonly records: WorkOrderStatsRecord[] = []) {}

  async findRecordsCreatedUntil(until: Date): Promise<WorkOrderStatsRecord[]> {
    this.requestedUntil = until;
    return this.records;
  }

  async findRecordById(id: string): Promise<WorkOrderStatsRecord | null> {
    void id;
    return this.records.length ? this.records[0] : null;
  }
}

describe('GetWorkOrderStatsUseCase', () => {
  let useCase: GetWorkOrderStatsUseCase;
  let statsRepository: FakeWorkOrderStatsRepository;

  beforeEach(() => {
    statsRepository = new FakeWorkOrderStatsRepository();
    useCase = new GetWorkOrderStatsUseCase(statsRepository);
  });

  it('should return all period with null dates by default', async () => {
    const result = await useCase.execute({}, NOW);

    expect(result.period).toBe('all');
    expect(result.start_date).toBeNull();
    expect(result.end_date).toBeNull();
  });

  it('should return every registered stat with name, value and hint', async () => {
    const result = await useCase.execute({}, NOW);

    expect(Object.keys(result.stats)).toHaveLength(WORK_ORDER_STATS.length);
    for (const stat of WORK_ORDER_STATS) {
      expect(result.stats[stat.tag]).toEqual({
        name: stat.name,
        value: expect.any(String),
        hint: stat.hint,
      });
    }
  });

  it('should resolve an informed period', async () => {
    const result = await useCase.execute({ period: 'week' }, NOW);

    expect(result).toMatchObject({
      period: 'week',
      start_date: '2026-03-04',
      end_date: '2026-03-11',
    });
  });

  it('should infer custom period from informed dates', async () => {
    const result = await useCase.execute(
      { startDate: '2026-03-11', endDate: '2026-03-20' },
      NOW,
    );

    expect(result).toMatchObject({
      period: 'custom',
      start_date: '2026-03-11',
      end_date: '2026-03-20',
    });
  });

  it('should query records until the last instant of the end date', async () => {
    await useCase.execute(
      { startDate: '2026-03-01', endDate: '2026-03-10' },
      NOW,
    );

    expect(statsRepository.requestedUntil).toEqual(
      new Date(2026, 2, 10, 23, 59, 59, 999),
    );
  });

  it('should use current time as the limit when there is no end date', async () => {
    await useCase.execute({ period: 'all' }, NOW);

    expect(statsRepository.requestedUntil).toEqual(NOW);
  });

  it('should ignore period when dates are provided', async () => {
    const result = await useCase.execute(
      { period: 'today', startDate: '2026-03-01' },
      NOW,
    );

    expect(result).toMatchObject({
      period: 'custom',
      start_date: '2026-03-01',
      end_date: '2026-03-11',
    });
  });

  it('should accept custom period without dates as all', async () => {
    const result = await useCase.execute({ period: 'custom' }, NOW);

    expect(result.period).toBe('all');
    expect(result.start_date).toBeNull();
    expect(result.end_date).toBeNull();
  });

  it('should keep custom period with only a start date', async () => {
    const result = await useCase.execute(
      { period: 'custom', startDate: '2026-03-01' },
      NOW,
    );

    expect(result).toMatchObject({
      period: 'custom',
      start_date: '2026-03-01',
      end_date: '2026-03-11',
    });
  });

  it('should reject an unsupported period', async () => {
    await expect(
      useCase.execute({ period: 'bogus' as never }, NOW),
    ).rejects.toThrow(InvalidWorkOrderStatsFilterError);
  });

  it('should reject an invalid start date', async () => {
    await expect(
      useCase.execute({ startDate: '2026-02-30' }, NOW),
    ).rejects.toThrow('start_date deve ser uma data YYYY-MM-DD válida');
  });

  it('should reject a malformed end date', async () => {
    await expect(
      useCase.execute({ endDate: '11/03/2026' }, NOW),
    ).rejects.toThrow('end_date deve ser uma data YYYY-MM-DD válida');
  });

  it('should reject start date after end date', async () => {
    await expect(
      useCase.execute({ startDate: '2026-03-20', endDate: '2026-03-11' }, NOW),
    ).rejects.toThrow('start_date deve ser anterior ou igual a end_date');
  });

  it('should accept start date equal to end date', async () => {
    const result = await useCase.execute(
      { startDate: '2026-03-11', endDate: '2026-03-11' },
      NOW,
    );

    expect(result).toMatchObject({
      period: 'custom',
      start_date: '2026-03-11',
      end_date: '2026-03-11',
    });
  });
});

describe('WORK_ORDER_STATS_REPOSITORY token', () => {
  it('should be a unique symbol', () => {
    expect(typeof WORK_ORDER_STATS_REPOSITORY).toBe('symbol');
  });
});
