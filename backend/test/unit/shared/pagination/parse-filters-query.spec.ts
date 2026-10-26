import { describe, it, expect } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { parseFiltersQuery } from '@/shared/pagination/parse-filters-query';

describe('parseFiltersQuery', () => {
  const allowedFilters = ['productType', 'unit'];

  it('returns undefined when value is undefined', () => {
    expect(parseFiltersQuery(undefined, allowedFilters)).toBeUndefined();
  });

  it('parses valid filters object', () => {
    const result = parseFiltersQuery(
      JSON.stringify({ productType: 'PART', unit: 'UNIT' }),
      allowedFilters,
    );

    expect(result).toEqual({ productType: 'PART', unit: 'UNIT' });
  });

  it('throws BadRequestException when JSON is invalid', () => {
    expect(() => parseFiltersQuery('invalid', allowedFilters)).toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException when filters is an array', () => {
    expect(() =>
      parseFiltersQuery(JSON.stringify([{ productType: 'PART' }]), allowedFilters),
    ).toThrow(BadRequestException);
  });

  it('throws BadRequestException when filter key is not allowed', () => {
    expect(() =>
      parseFiltersQuery(
        JSON.stringify({ productType: 'PART', hacked: true }),
        allowedFilters,
      ),
    ).toThrow(BadRequestException);
  });
});
