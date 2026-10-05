import { Injectable, Inject } from '@nestjs/common';
import { ProductRepository } from '@/domain/repositories/product.repository';
import { StockRepository } from '@/domain/repositories/stock.repository';
import { ProductNotFoundError } from '@/domain/errors/product-not-found.error';
import { ProductHasStockError } from '@/domain/errors/product-has-stock.error';
import { PRODUCT_REPOSITORY } from '../create-product/create-product.use-case';
import { DeleteProductInputDto } from './delete-product-input.dto';

export const STOCK_REPOSITORY = Symbol('STOCK_REPOSITORY');

@Injectable()
export class DeleteProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(STOCK_REPOSITORY)
    private readonly stockRepository: StockRepository,
  ) {}

  async execute(input: DeleteProductInputDto): Promise<void> {
    const product = await this.productRepository.findById(input.id);

    if (!product) {
      throw new ProductNotFoundError(input.id);
    }

    const stock = await this.stockRepository.findByProductId(product.id);

    if (stock && stock.hasBalance()) {
      throw new ProductHasStockError(product.id);
    }

    product.deactivate();

    await this.productRepository.save(product);
  }
}
