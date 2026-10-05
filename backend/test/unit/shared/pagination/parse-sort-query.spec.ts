import { describe, it, expect } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { parseSortQuery } from '@/shared/pagination/parse-sort-query';

describe('parseSortQuery', () => {
  const allowedColumns = ['name', 'createdAt'];

  it('returns undefined when value is undefined', () => {
    expect(parseSortQuery(undefined, allowedColumns)).toBeUndefined();
  });

  it('parses a single sort object into an array', () => {
    const result = parseSortQuery(
      JSON.stringify({ field: 'createdAt', order: 'desc' }),
      allowedColumns,
    );

    expect(result).toEqual([{ field: 'createdAt', order: 'desc' }]);
  });

  it('parses an array of sort objects', () => {
    const result = parseSortQuery(
      JSON.stringify([
        { field: 'createdAt', order: 'desc' },
        { field: 'name', order: 'asc' },
      ]),
      allowedColumns,
    );

    expect(result).toEqual([
      { field: 'createdAt', order: 'desc' },
      { field: 'name', order: 'asc' },
    ]);
  });

  it('throws BadRequestException when JSON is invalid', () => {
    expect(() => parseSortQuery('invalid', allowedColumns)).toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException when field is missing', () => {
    expect(() =>
      parseSortQuery(JSON.stringify({ order: 'desc' }), allowedColumns),
    ).toThrow(BadRequestException);
  });

  it('throws BadRequestException when order is invalid', () => {
    expect(() =>
      parseSortQuery(
        JSON.stringify({ field: 'createdAt', order: 'invalid' }),
        allowedColumns,
      ),
    ).toThrow(BadRequestException);
  });

  it('throws BadRequestException when field is not allowed', () => {
    expect(() =>
      parseSortQuery(
        JSON.stringify({ field: 'password', order: 'asc' }),
        allowedColumns,
      ),
    ).toThrow(BadRequestException);
  });
});
