import { Inject, Injectable } from '@nestjs/common';
import { WorkOrderAccessDeniedError } from '@/domain/errors/work-order-access-denied.error';
import { WorkOrderNotFoundError } from '@/domain/errors/work-order-not-found.error';
import {
  WORK_ORDER_REPOSITORY,
  WorkOrderRepository,
} from '@/domain/repositories/work-order.repository';
import {
  WORK_ORDER_STATS_REPOSITORY,
  WorkOrderStatsRepository,
} from '@/application/ports/work-order-stats.repository';
import { GetWorkOrderStatsUseCase } from '../get-work-order-stats/get-work-order-stats.use-case';
import { GetWorkOrderStatsDetailInputDto } from './get-work-order-stats-detail-input.dto';
import { GetWorkOrderStatsDetailOutputDto } from './get-work-order-stats-detail-output.dto';
import {
  buildWorkOrderCurrentStatus,
  buildWorkOrderStages,
  buildWorkOrderTotal,
} from './stages';

/**
 * Estatísticas individuais de uma ordem de serviço: duração de cada etapa do
 * ciclo de vida, tempo total e tempo no status atual, comparados com as
 * médias globais da oficina (cálculo de `GET /stats` com `period=all`).
 */
@Injectable()
export class GetWorkOrderStatsDetailUseCase {
  constructor(
    @Inject(WORK_ORDER_REPOSITORY)
    private readonly workOrders: WorkOrderRepository,
    @Inject(WORK_ORDER_STATS_REPOSITORY)
    private readonly statsRepository: WorkOrderStatsRepository,
    private readonly globalStats: GetWorkOrderStatsUseCase,
  ) {}

  async execute(
    input: GetWorkOrderStatsDetailInputDto,
    now: Date = new Date(),
  ): Promise<GetWorkOrderStatsDetailOutputDto> {
    const order = await this.workOrders.findById(input.id);
    if (!order) {
      throw new WorkOrderNotFoundError(input.id);
    }
    if (
      input.actor.entityType === 'client' &&
      order.clientId !== input.actor.id
    ) {
      throw new WorkOrderAccessDeniedError();
    }

    const record = await this.statsRepository.findRecordById(input.id);
    if (!record) {
      throw new WorkOrderNotFoundError(input.id);
    }

    const globalResult = await this.globalStats.execute({ period: 'all' }, now);

    return {
      id: order.id,
      number: order.number,
      status: order.status,
      createdAt: order.createdAt,
      stages: buildWorkOrderStages(record, globalResult.stats, now),
      total: buildWorkOrderTotal(record, globalResult.stats, now),
      currentStatus: buildWorkOrderCurrentStatus(record, now),
    };
  }
}
