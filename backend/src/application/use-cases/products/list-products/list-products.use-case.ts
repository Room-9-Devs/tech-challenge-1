import { Injectable, Inject } from '@nestjs/common';
import { ProductRepository } from '@/domain/repositories/product.repository';
import { PRODUCT_REPOSITORY } from '../create-product/create-product.use-case';
import { ListProductsOutputDto } from './list-products-output.dto';

@Injectable()
export class ListProductsUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(): Promise<ListProductsOutputDto> {
    const products = await this.productRepository.findAll();

    return {
      products: products.map((product) => ({
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
    };
  }
}
