import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, Matches } from 'class-validator';
import { STATS_PERIODS } from '@/application/use-cases/work-order-stats/get-work-order-stats/resolve-stats-period';

export class StatsQueryDto {
  @ApiPropertyOptional({
    description:
      'Período das estatísticas. Ignorado quando start_date ou end_date forem informados. "custom" sem datas equivale a "all".',
    enum: [...STATS_PERIODS],
    default: 'all',
    example: 'week',
  })
  @IsOptional()
  @IsIn(STATS_PERIODS)
  period?: (typeof STATS_PERIODS)[number];

  @ApiPropertyOptional({
    description:
      'Data inicial do período (YYYY-MM-DD). Informado, sobrescreve o period.',
    example: '2026-03-11',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'start_date deve estar no formato YYYY-MM-DD',
  })
  start_date?: string;

  @ApiPropertyOptional({
    description:
      'Data final do período (YYYY-MM-DD). Informado, sobrescreve o period.',
    example: '2026-03-20',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'end_date deve estar no formato YYYY-MM-DD',
  })
  end_date?: string;
}
