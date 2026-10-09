import { Injectable, Inject } from '@nestjs/common';
import { StockMovementRepository } from '@/domain/repositories/stock-movement.repository';
import { ListStockMovementsInputDto } from './list-stock-movements-input.dto';
import { ListStockMovementsOutputDto } from './list-stock-movements-output.dto';

export const STOCK_MOVEMENT_REPOSITORY = Symbol('STOCK_MOVEMENT_REPOSITORY');

@Injectable()
export class ListStockMovementsUseCase {
  constructor(
    @Inject(STOCK_MOVEMENT_REPOSITORY)
    private readonly stockMovementRepository: StockMovementRepository,
  ) {}

  async execute(
    input: ListStockMovementsInputDto = {},
  ): Promise<ListStockMovementsOutputDto> {
    const { filters, startDate, endDate, ...paginationQuery } = input;

    const { data, meta } = await this.stockMovementRepository.findAll({
      page: paginationQuery.page ?? 1,
      limit: paginationQuery.limit ?? 10,
      search: paginationQuery.search,
      sort: paginationQuery.sort,
      filters: { ...filters },
      startDate,
      endDate,
    });

    return {
      data: data.map(({ stockMovement, product }) => ({
        id: stockMovement.id,
        productId: stockMovement.productId,
        product: {
          id: product.id,
          sku: product.sku,
          name: product.name,
          productType: product.productType,
          unit: product.unit,
        },
        movementType: stockMovement.movementType,
        quantity: stockMovement.quantity,
        previousQuantity: stockMovement.previousQuantity,
        description: stockMovement.description,
        referenceType: stockMovement.referenceType,
        referenceId: stockMovement.referenceId,
        createdBy: stockMovement.createdBy,
        createdAt: stockMovement.createdAt,
      })),
      meta,
    };
  }
}
