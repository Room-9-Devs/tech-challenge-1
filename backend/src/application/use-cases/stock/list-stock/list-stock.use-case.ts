import { Injectable, Inject } from '@nestjs/common';
import { StockRepository } from '@/domain/repositories/stock.repository';
import { STOCK_REPOSITORY } from '../../products/delete-product/delete-product.use-case';
import { ListStockInputDto } from './list-stock-input.dto';
import { ListStockOutputDto } from './list-stock-output.dto';

@Injectable()
export class ListStockUseCase {
  constructor(
    @Inject(STOCK_REPOSITORY)
    private readonly stockRepository: StockRepository,
  ) {}

  async execute(input: ListStockInputDto = {}): Promise<ListStockOutputDto> {
    const { filters, ...paginationQuery } = input;

    const { data, meta } = await this.stockRepository.findAll({
      page: paginationQuery.page ?? 1,
      limit: paginationQuery.limit ?? 10,
      search: paginationQuery.search,
      sort: paginationQuery.sort,
      filters: { ...filters },
    });

    return {
      data: data.map(({ stock, product }) => ({
        id: stock.id,
        productId: stock.productId,
        product: {
          id: product.id,
          sku: product.sku,
          name: product.name,
          productType: product.productType,
          unit: product.unit,
        },
        quantity: stock.quantity,
        reserved: stock.reserved,
        available: stock.available,
        createdAt: stock.createdAt,
        updatedAt: stock.updatedAt,
      })),
      meta,
    };
  }
}
