import { BadRequestException } from '@nestjs/common';
import { SortConfig } from './pagination.types';

export function parseSortQuery(
  value: string | undefined,
  allowedColumns: string[],
): SortConfig[] | undefined {
  if (!value) return undefined;

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new BadRequestException('sort deve ser um JSON válido');
  }

  const items = Array.isArray(parsed) ? parsed : [parsed];

  for (const item of items) {
    if (
      !item ||
      typeof item !== 'object' ||
      typeof (item as Record<string, unknown>).field !== 'string' ||
      !['asc', 'desc'].includes((item as Record<string, unknown>).order as string)
    ) {
      throw new BadRequestException(
        'Cada item de sort deve ter field e order (asc|desc)',
      );
    }

    const field = (item as Record<string, unknown>).field as string;

    if (!allowedColumns.includes(field)) {
      throw new BadRequestException(`A ordenação pelo campo '${field}' não é permitida`);
    }
  }

  return items as SortConfig[];
}
