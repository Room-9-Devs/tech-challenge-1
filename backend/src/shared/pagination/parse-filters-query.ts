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
    throw new BadRequestException('filters deve ser um objeto JSON válido');
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new BadRequestException('filters deve ser um objeto JSON válido');
  }

  const filters = parsed as Record<string, unknown>;
  for (const key of Object.keys(filters)) {
    if (!allowedFilters.includes(key)) {
      throw new BadRequestException(`O filtro '${key}' não é permitido`);
    }
  }

  return filters;
}
