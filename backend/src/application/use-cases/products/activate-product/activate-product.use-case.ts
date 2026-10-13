import { Injectable, Inject } from '@nestjs/common';
import { ProductRepository } from '@/domain/repositories/product.repository';
import { ProductNotFoundError } from '@/domain/errors/product-not-found.error';
import { ProductAlreadyActiveError } from '@/domain/errors/product-already-active.error';
import { PRODUCT_REPOSITORY } from '../create-product/create-product.use-case';
import { ActivateProductInputDto } from './activate-product-input.dto';
import { ActivateProductOutputDto } from './activate-product-output.dto';

@Injectable()
export class ActivateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(input: ActivateProductInputDto): Promise<ActivateProductOutputDto> {
    const product = await this.productRepository.findByIdIncludingInactive(input.id);

    if (!product) {
      throw new ProductNotFoundError(input.id);
    }

    if (product.active) {
      throw new ProductAlreadyActiveError(product.id);
    }

    product.activate();

    const activatedProduct = await this.productRepository.save(product);

    return {
      id: activatedProduct.id,
      sku: activatedProduct.sku,
      name: activatedProduct.name,
      description: activatedProduct.description,
      productType: activatedProduct.productType,
      unit: activatedProduct.unit,
      cost: activatedProduct.cost,
      salePrice: activatedProduct.salePrice,
      active: activatedProduct.active,
      createdAt: activatedProduct.createdAt,
      updatedAt: activatedProduct.updatedAt,
    };
  }
}
