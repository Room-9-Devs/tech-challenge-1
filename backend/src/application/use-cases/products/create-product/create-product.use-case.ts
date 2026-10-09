import { Injectable, Inject } from '@nestjs/common';
import { Product } from '@/domain/entities/product.entity';
import { ProductRepository } from '@/domain/repositories/product.repository';
import { ProductAlreadyExistsError } from '@/domain/errors/product-already-exists.error';
import { CreateProductInputDto } from './create-product-input.dto';
import { CreateProductOutputDto } from './create-product-output.dto';
import { DOMAIN_EVENT_PUBLISHER, DomainEventPublisher } from '@/application/ports/domain-event-publisher.port';
import { ProductCreatedEvent } from '@/domain/events/product.events';

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async execute(input: CreateProductInputDto): Promise<CreateProductOutputDto> {
    const existingProduct = await this.productRepository.findBySku(input.sku);

    if (existingProduct) {
      throw new ProductAlreadyExistsError(input.sku);
    }

    const product = Product.create({
      sku: input.sku,
      name: input.name,
      description: input.description,
      productType: input.productType,
      unit: input.unit,
      cost: input.cost,
      salePrice: input.salePrice,
    });

    const savedProduct = await this.productRepository.save(product);

    await this.eventPublisher.publish(
      new ProductCreatedEvent(savedProduct.id, {
        sku: savedProduct.sku,
        name: savedProduct.name,
        productType: savedProduct.productType,
        unit: savedProduct.unit,
        cost: savedProduct.cost,
        salePrice: savedProduct.salePrice,
      }),
    );

    return {
      id: savedProduct.id,
      sku: savedProduct.sku,
      name: savedProduct.name,
      description: savedProduct.description,
      productType: savedProduct.productType,
      unit: savedProduct.unit,
      cost: savedProduct.cost,
      salePrice: savedProduct.salePrice,
      active: savedProduct.active,
      createdAt: savedProduct.createdAt,
      updatedAt: savedProduct.updatedAt,
    };
  }
}
