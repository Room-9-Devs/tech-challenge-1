import { ApiProperty } from '@nestjs/swagger';
import { STATS_PERIODS } from '@/application/use-cases/work-order-stats/get-work-order-stats/resolve-stats-period';

export class StatsResponseDto {
  @ApiProperty({
    description:
      'Período informado pelo cliente ou inferido a partir das datas',
    enum: [...STATS_PERIODS],
    example: 'week',
  })
  period: string;

  @ApiProperty({
    description: 'Data inicial efetiva do período (YYYY-MM-DD) ou null',
    example: '2026-03-04',
    nullable: true,
    type: String,
  })
  start_date: string | null;

  @ApiProperty({
    description: 'Data final efetiva do período (YYYY-MM-DD) ou null',
    example: '2026-03-11',
    nullable: true,
    type: String,
  })
  end_date: string | null;

  @ApiProperty({
    description:
      'Estatísticas de ordens de serviço do período, indexadas por tag. Cada entrada tem name, value e hint (explicação do cálculo, pensada como tooltip no frontend)',
    type: 'object',
    additionalProperties: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        value: { type: 'string' },
        hint: { type: 'string' },
      },
    },
    example: {
      wo_started: {
        name: 'Ordens de serviço iniciadas',
        value: '12',
        hint: 'Quantidade de ordens de serviço criadas com data de criação dentro do período.',
      },
    },
  })
  stats: Record<string, { name: string; value: string; hint: string }>;
}
