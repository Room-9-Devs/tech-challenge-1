import { Injectable, Inject } from '@nestjs/common';
import { ProductRepository } from '@/domain/repositories/product.repository';
import { ProductNotFoundError } from '@/domain/errors/product-not-found.error';
import { PRODUCT_REPOSITORY } from '../create-product/create-product.use-case';
import { FindProductInputDto } from './find-product-input.dto';
import { FindProductOutputDto } from './find-product-output.dto';

@Injectable()
export class FindProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(input: FindProductInputDto): Promise<FindProductOutputDto> {
    const product = await this.productRepository.findById(input.id);

    if (!product) {
      throw new ProductNotFoundError(input.id);
    }

    return {
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
    };
  }
}
