import { BadRequestException, Injectable } from '@nestjs/common';
import { GetWorkOrderStatsInputDto } from './get-work-order-stats-input.dto';
import { GetWorkOrderStatsOutputDto } from './get-work-order-stats-output.dto';
import {
  STATS_PERIODS,
  isValidIsoDate,
  resolveStatsPeriod,
} from './resolve-stats-period';

@Injectable()
export class GetWorkOrderStatsUseCase {
  async execute(
    input: GetWorkOrderStatsInputDto = {},
    now: Date = new Date(),
  ): Promise<GetWorkOrderStatsOutputDto> {
    const { period, startDate, endDate } = input;

    if (period && !(STATS_PERIODS as readonly string[]).includes(period)) {
      throw new BadRequestException(
        `period deve ser um dos valores: ${STATS_PERIODS.join(', ')}`,
      );
    }
    if (startDate && !isValidIsoDate(startDate)) {
      throw new BadRequestException(
        'start_date deve ser uma data YYYY-MM-DD válida',
      );
    }
    if (endDate && !isValidIsoDate(endDate)) {
      throw new BadRequestException(
        'end_date deve ser uma data YYYY-MM-DD válida',
      );
    }
    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException(
        'start_date deve ser anterior ou igual a end_date',
      );
    }

    const resolved = resolveStatsPeriod({ period, startDate, endDate }, now);

    return {
      period: resolved.period,
      start_date: resolved.startDate,
      end_date: resolved.endDate,
      stats: {},
    };
  }
}
