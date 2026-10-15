import { BadRequestException } from '@nestjs/common';
import { GetWorkOrderStatsUseCase } from '@/application/use-cases/work-order-stats/get-work-order-stats/get-work-order-stats.use-case';

// Data fixa para testes determinísticos: 2026-03-11
const NOW = new Date(2026, 2, 11, 15, 30, 0);

describe('GetWorkOrderStatsUseCase', () => {
  let useCase: GetWorkOrderStatsUseCase;

  beforeEach(() => {
    useCase = new GetWorkOrderStatsUseCase();
  });

  it('should return all period with null dates and empty stats by default', async () => {
    const result = await useCase.execute({}, NOW);

    expect(result).toEqual({
      period: 'all',
      start_date: null,
      end_date: null,
      stats: {},
    });
  });

  it('should resolve an informed period', async () => {
    const result = await useCase.execute({ period: 'week' }, NOW);

    expect(result).toEqual({
      period: 'week',
      start_date: '2026-03-04',
      end_date: '2026-03-11',
      stats: {},
    });
  });

  it('should infer custom period from informed dates', async () => {
    const result = await useCase.execute(
      { startDate: '2026-03-11', endDate: '2026-03-20' },
      NOW,
    );

    expect(result).toEqual({
      period: 'custom',
      start_date: '2026-03-11',
      end_date: '2026-03-20',
      stats: {},
    });
  });

  it('should ignore period when dates are provided', async () => {
    const result = await useCase.execute(
      { period: 'today', startDate: '2026-03-01' },
      NOW,
    );

    expect(result).toEqual({
      period: 'custom',
      start_date: '2026-03-01',
      end_date: '2026-03-11',
      stats: {},
    });
  });

  it('should accept custom period without dates as all', async () => {
    const result = await useCase.execute({ period: 'custom' }, NOW);

    expect(result).toEqual({
      period: 'all',
      start_date: null,
      end_date: null,
      stats: {},
    });
  });

  it('should keep custom period with only a start date', async () => {
    const result = await useCase.execute(
      { period: 'custom', startDate: '2026-03-01' },
      NOW,
    );

    expect(result).toEqual({
      period: 'custom',
      start_date: '2026-03-01',
      end_date: '2026-03-11',
      stats: {},
    });
  });

  it('should reject an unsupported period', async () => {
    await expect(
      useCase.execute({ period: 'bogus' as never }, NOW),
    ).rejects.toThrow(BadRequestException);
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

    expect(result).toEqual({
      period: 'custom',
      start_date: '2026-03-11',
      end_date: '2026-03-11',
      stats: {},
    });
  });
});
