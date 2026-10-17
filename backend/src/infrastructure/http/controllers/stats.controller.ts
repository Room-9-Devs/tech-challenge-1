import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetWorkOrderStatsUseCase } from '@/application/use-cases/work-order-stats/get-work-order-stats/get-work-order-stats.use-case';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { StatsQueryDto } from '../dtos/stats-query.dto';
import { StatsResponseDto } from '../dtos/stats-response.dto';
import { STATS_PERIODS } from '@/application/use-cases/work-order-stats/get-work-order-stats/resolve-stats-period';

@ApiTags('Estatísticas')
@ApiBearerAuth('access-token')
@Controller('stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiResponse({
  status: HttpStatus.UNAUTHORIZED,
  description: 'Autenticação obrigatória',
})
export class StatsController {
  constructor(private readonly getWorkOrderStats: GetWorkOrderStatsUseCase) { }

  @Get()
  @Roles('admin')
  @ApiOperation({
    summary:
      'Retorna estatísticas de ordens de serviço para o período informado',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: [...STATS_PERIODS],
    default: 'all',
    description:
      'Período; ignorado quando start_date ou end_date forem informados. "custom" sem datas equivale a "all".',
    example: 'week',
  })
  @ApiQuery({
    name: 'start_date',
    required: false,
    type: String,
    example: '2026-03-11',
    description: 'Data inicial do período (YYYY-MM-DD); sobrescreve o period',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    type: String,
    example: '2026-03-20',
    description: 'Data final do período (YYYY-MM-DD); sobrescreve o period',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Período efetivo (informado ou inferido) e estatísticas correspondentes',
    type: StatsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Period, start_date ou end_date inválidos, ou start_date posterior a end_date',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Ação não permitida para o papel',
  })
  async getStats(@Query() query: StatsQueryDto): Promise<StatsResponseDto> {
    return this.getWorkOrderStats.execute({
      period: query.period,
      startDate: query.start_date ?? null,
      endDate: query.end_date ?? null,
    });
  }
}
