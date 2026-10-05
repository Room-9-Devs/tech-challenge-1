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
    throw new BadRequestException('sort must be a valid JSON');
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
        'sort items must have field and order (asc|desc)',
      );
    }

    const field = (item as Record<string, unknown>).field as string;

    if (!allowedColumns.includes(field)) {
      throw new BadRequestException(`sort field '${field}' is not allowed`);
    }
  }

  return items as SortConfig[];
}
