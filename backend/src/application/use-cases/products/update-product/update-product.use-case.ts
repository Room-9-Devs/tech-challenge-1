import { Injectable, Inject } from '@nestjs/common';
import { ProductRepository } from '@/domain/repositories/product.repository';
import { ProductNotFoundError } from '@/domain/errors/product-not-found.error';
import { ProductAlreadyExistsError } from '@/domain/errors/product-already-exists.error';
import { PRODUCT_REPOSITORY } from '../create-product/create-product.use-case';
import { UpdateProductInputDto } from './update-product-input.dto';
import { UpdateProductOutputDto } from './update-product-output.dto';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
  ) {}

  async execute(input: UpdateProductInputDto): Promise<UpdateProductOutputDto> {
    const product = await this.productRepository.findById(input.id);

    if (!product) {
      throw new ProductNotFoundError(input.id);
    }

    if (product.sku !== input.sku) {
      const existingProduct = await this.productRepository.findBySku(input.sku);

      if (existingProduct) {
        throw new ProductAlreadyExistsError(input.sku);
      }
    }

    product.changeSku(input.sku);
    product.changeName(input.name);
    product.changeDescription(input.description);
    product.changeProductType(input.productType);
    product.changeUnit(input.unit);
    product.changeCost(input.cost);
    product.changeSalePrice(input.salePrice);

    const updatedProduct = await this.productRepository.save(product);

    return {
      id: updatedProduct.id,
      sku: updatedProduct.sku,
      name: updatedProduct.name,
      description: updatedProduct.description,
      productType: updatedProduct.productType,
      unit: updatedProduct.unit,
      cost: updatedProduct.cost,
      salePrice: updatedProduct.salePrice,
      active: updatedProduct.active,
      createdAt: updatedProduct.createdAt,
      updatedAt: updatedProduct.updatedAt,
    };
  }
}
