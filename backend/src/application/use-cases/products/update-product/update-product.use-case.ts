import { Injectable, Inject } from '@nestjs/common';
import { ProductRepository } from '@/domain/repositories/product.repository';
import { ProductNotFoundError } from '@/domain/errors/product-not-found.error';
import { ProductAlreadyExistsError } from '@/domain/errors/product-already-exists.error';
import { PRODUCT_REPOSITORY } from '../create-product/create-product.use-case';
import { UpdateProductInputDto } from './update-product-input.dto';
import { UpdateProductOutputDto } from './update-product-output.dto';
import { DOMAIN_EVENT_PUBLISHER, DomainEventPublisher } from '@/application/ports/domain-event-publisher.port';
import { ProductUpdatedEvent, ProductPriceChangedEvent } from '@/domain/events/product.events';

@Injectable()
export class UpdateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly eventPublisher: DomainEventPublisher,
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

    const oldValues = {
      sku: product.sku,
      name: product.name,
      description: product.description,
      productType: product.productType,
      unit: product.unit,
      cost: product.cost,
      salePrice: product.salePrice,
    };

    product.changeSku(input.sku);
    product.changeName(input.name);
    product.changeDescription(input.description);
    product.changeProductType(input.productType);
    product.changeUnit(input.unit);
    product.changeCost(input.cost);
    product.changeSalePrice(input.salePrice);

    const updatedProduct = await this.productRepository.save(product);

    const changedFields = Object.keys(input).filter(
      (key) => key !== 'id' && key !== 'createdBy' && oldValues[key as keyof typeof oldValues] !== input[key as keyof UpdateProductInputDto],
    );

    await this.eventPublisher.publish(
      new ProductUpdatedEvent(updatedProduct.id, input.createdBy, {
        changedFields,
        old: oldValues,
        new: {
          sku: updatedProduct.sku,
          name: updatedProduct.name,
          description: updatedProduct.description,
          productType: updatedProduct.productType,
          unit: updatedProduct.unit,
          cost: updatedProduct.cost,
          salePrice: updatedProduct.salePrice,
        },
      }),
    );

    if (oldValues.cost !== updatedProduct.cost || oldValues.salePrice !== updatedProduct.salePrice) {
      await this.eventPublisher.publish(
        new ProductPriceChangedEvent(updatedProduct.id, input.createdBy, {
          oldCost: oldValues.cost,
          newCost: updatedProduct.cost,
          oldSalePrice: oldValues.salePrice,
          newSalePrice: updatedProduct.salePrice,
        }),
      );
    }

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
