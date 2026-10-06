import { Injectable, Inject } from '@nestjs/common';
import { ProductRepository } from '@/domain/repositories/product.repository';
import { PRODUCT_REPOSITORY } from '../create-product/create-product.use-case';
import { ListProductsInputDto } from './list-products-input.dto';
import { ListProductsOutputDto } from './list-products-output.dto';

@Injectable()
export class ListProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(
    input: ListProductsInputDto = {},
  ): Promise<ListProductsOutputDto> {
    const { filters, ...paginationQuery } = input;

    const { data, meta } = await this.productRepository.findAll({
      page: paginationQuery.page ?? 1,
      limit: paginationQuery.limit ?? 10,
      search: paginationQuery.search,
      sort: paginationQuery.sort,
      filters: { ...filters, active: true },
    });

    return {
      data: data.map((product) => ({
        id: product.id,
        sku: product.sku,
        name: product.name,
        description: product.description,
        productType: product.productType,
        unit: product.unit,
        cost: product.cost,
        salePrice: product.salePrice,
        active: product.active,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      })),
      meta,
    };
  }
}
