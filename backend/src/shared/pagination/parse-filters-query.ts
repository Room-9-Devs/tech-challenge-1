import { BadRequestException } from '@nestjs/common';

export function parseFiltersQuery(
  value: string | undefined,
  allowedFilters: string[],
): Record<string, unknown> | undefined {
  if (!value) return undefined;

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new BadRequestException('filters must be a valid JSON object');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new BadRequestException('filters must be a valid JSON object');
  }

  const filters = parsed as Record<string, unknown>;
  for (const key of Object.keys(filters)) {
    if (!allowedFilters.includes(key)) {
      throw new BadRequestException(`filter '${key}' is not allowed`);
    }
  }

  return filters;
}
