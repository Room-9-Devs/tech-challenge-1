import {
  resolveStatsPeriod,
  isValidIsoDate,
} from '@/application/use-cases/work-order-stats/get-work-order-stats/resolve-stats-period';

// Data fixa para testes determinísticos: 2026-03-11 (quarta-feira)
const NOW = new Date(2026, 2, 11, 15, 30, 0);

describe('resolveStatsPeriod', () => {
  it('should default to all period with no date limits', () => {
    expect(resolveStatsPeriod({}, NOW)).toEqual({
      period: 'all',
      startDate: null,
      endDate: null,
    });
  });

  it('should keep explicit all period', () => {
    expect(resolveStatsPeriod({ period: 'all' }, NOW)).toEqual({
      period: 'all',
      startDate: null,
      endDate: null,
    });
  });

  it('should treat custom period without dates as all', () => {
    expect(resolveStatsPeriod({ period: 'custom' }, NOW)).toEqual({
      period: 'all',
      startDate: null,
      endDate: null,
    });
  });

  it('should keep custom period with informed dates', () => {
    expect(
      resolveStatsPeriod(
        { period: 'custom', startDate: '2026-03-01', endDate: '2026-03-10' },
        NOW,
      ),
    ).toEqual({
      period: 'custom',
      startDate: '2026-03-01',
      endDate: '2026-03-10',
    });
  });

  it('should resolve today to the same day on both ends', () => {
    expect(resolveStatsPeriod({ period: 'today' }, NOW)).toEqual({
      period: 'today',
      startDate: '2026-03-11',
      endDate: '2026-03-11',
    });
  });

  it('should resolve week to seven days ago until today', () => {
    expect(resolveStatsPeriod({ period: 'week' }, NOW)).toEqual({
      period: 'week',
      startDate: '2026-03-04',
      endDate: '2026-03-11',
    });
  });

  it('should resolve two-weeks to fourteen days ago until today', () => {
    expect(resolveStatsPeriod({ period: 'two-weeks' }, NOW)).toEqual({
      period: 'two-weeks',
      startDate: '2026-02-25',
      endDate: '2026-03-11',
    });
  });

  it('should resolve month to the same day last month', () => {
    expect(resolveStatsPeriod({ period: 'month' }, NOW)).toEqual({
      period: 'month',
      startDate: '2026-02-11',
      endDate: '2026-03-11',
    });
  });

  it('should clamp month start to the last valid day of the target month', () => {
    const march31st = new Date(2026, 2, 31, 12, 0, 0);
    expect(resolveStatsPeriod({ period: 'month' }, march31st)).toEqual({
      period: 'month',
      startDate: '2026-02-28',
      endDate: '2026-03-31',
    });
  });

  it('should resolve two-months to two months ago', () => {
    expect(resolveStatsPeriod({ period: 'two-months' }, NOW)).toEqual({
      period: 'two-months',
      startDate: '2026-01-11',
      endDate: '2026-03-11',
    });
  });

  it('should resolve three-months to three months ago', () => {
    expect(resolveStatsPeriod({ period: 'three-months' }, NOW)).toEqual({
      period: 'three-months',
      startDate: '2025-12-11',
      endDate: '2026-03-11',
    });
  });

  it('should resolve year to the same date one year ago', () => {
    expect(resolveStatsPeriod({ period: 'year' }, NOW)).toEqual({
      period: 'year',
      startDate: '2025-03-11',
      endDate: '2026-03-11',
    });
  });

  it('should clamp year start on leap day to february 28', () => {
    const feb29th2024 = new Date(2024, 1, 29, 12, 0, 0);
    expect(resolveStatsPeriod({ period: 'year' }, feb29th2024)).toEqual({
      period: 'year',
      startDate: '2023-02-28',
      endDate: '2024-02-29',
    });
  });

  it('should resolve month-start to the first day of the current month', () => {
    expect(resolveStatsPeriod({ period: 'month-start' }, NOW)).toEqual({
      period: 'month-start',
      startDate: '2026-03-01',
      endDate: '2026-03-11',
    });
  });

  it('should resolve year-start to january 1 of the current year', () => {
    expect(resolveStatsPeriod({ period: 'year-start' }, NOW)).toEqual({
      period: 'year-start',
      startDate: '2026-01-01',
      endDate: '2026-03-11',
    });
  });

  it('should infer end date as today when only start date is given', () => {
    expect(resolveStatsPeriod({ startDate: '2026-03-01' }, NOW)).toEqual({
      period: 'custom',
      startDate: '2026-03-01',
      endDate: '2026-03-11',
    });
  });

  it('should keep start date null when only end date is given', () => {
    expect(resolveStatsPeriod({ endDate: '2026-02-20' }, NOW)).toEqual({
      period: 'custom',
      startDate: null,
      endDate: '2026-02-20',
    });
  });

  it('should keep both informed dates as custom period', () => {
    expect(
      resolveStatsPeriod(
        { startDate: '2026-03-11', endDate: '2026-03-20' },
        NOW,
      ),
    ).toEqual({
      period: 'custom',
      startDate: '2026-03-11',
      endDate: '2026-03-20',
    });
  });

  it('should ignore period when dates are provided', () => {
    expect(
      resolveStatsPeriod(
        { period: 'week', startDate: '2026-01-01', endDate: '2026-01-31' },
        NOW,
      ),
    ).toEqual({
      period: 'custom',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });
  });

  it('should cross year boundaries correctly', () => {
    const jan5th2026 = new Date(2026, 0, 5, 10, 0, 0);
    expect(resolveStatsPeriod({ period: 'week' }, jan5th2026)).toEqual({
      period: 'week',
      startDate: '2025-12-29',
      endDate: '2026-01-05',
    });
  });
});

describe('isValidIsoDate', () => {
  it('should accept real dates in YYYY-MM-DD format', () => {
    expect(isValidIsoDate('2026-03-11')).toBe(true);
    expect(isValidIsoDate('2024-02-29')).toBe(true);
  });

  it('should reject malformed or impossible dates', () => {
    expect(isValidIsoDate('2026-3-11')).toBe(false);
    expect(isValidIsoDate('2026/03/11')).toBe(false);
    expect(isValidIsoDate('2026-02-30')).toBe(false);
    expect(isValidIsoDate('2026-13-01')).toBe(false);
    expect(isValidIsoDate('not-a-date')).toBe(false);
  });
});
