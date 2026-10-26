import { Injectable, Inject } from '@nestjs/common';
import { StockMovement } from '@/domain/entities/stock-movement.entity';
import { ProductRepository } from '@/domain/repositories/product.repository';
import { ProductNotFoundError } from '@/domain/errors/product-not-found.error';
import { StockNotFoundError } from '@/domain/errors/stock-not-found.error';
import {
  STOCK_MOVEMENT_UNIT_OF_WORK,
  StockMovementUnitOfWork,
} from '@/application/ports/stock-movement-unit-of-work.port';
import {
  DOMAIN_EVENT_PUBLISHER,
  DomainEventPublisher,
} from '@/application/ports/domain-event-publisher.port';
import { StockAdjustedEvent } from '@/domain/events/stock.events';
import { PRODUCT_REPOSITORY } from '../../products/create-product/create-product.use-case';
import { CreateStockMovementInputDto } from './create-stock-movement-input.dto';
import { CreateStockMovementOutputDto } from './create-stock-movement-output.dto';

@Injectable()
export class CreateStockMovementUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: ProductRepository,
    @Inject(STOCK_MOVEMENT_UNIT_OF_WORK)
    private readonly unitOfWork: StockMovementUnitOfWork,
    @Inject(DOMAIN_EVENT_PUBLISHER)
    private readonly eventPublisher: DomainEventPublisher,
  ) {}

  async execute(
    input: CreateStockMovementInputDto,
  ): Promise<CreateStockMovementOutputDto> {
    const product = await this.productRepository.findById(input.productId);

    if (!product) {
      throw new ProductNotFoundError(input.productId);
    }

    const result = await this.unitOfWork.run(async ({ stocks, stockMovements }) => {
      const stock = await stocks.findByProductId(product.id);

      if (!stock) {
        throw new StockNotFoundError(product.id);
      }

      const stockMovement = StockMovement.create({
        productId: product.id,
        movementType: input.movementType,
        quantity: input.quantity,
        previousQuantity: stock.quantity,
        description: input.description,
        referenceType: input.referenceType,
        referenceId: input.referenceId,
        createdBy: input.createdBy,
      });

      stock.applyMovement(stockMovement);

      const savedStock = await stocks.save(stock);
      const savedStockMovement = await stockMovements.save(stockMovement);

      return {
        id: savedStockMovement.id,
        productId: savedStockMovement.productId,
        movementType: savedStockMovement.movementType,
        quantity: savedStockMovement.quantity,
        previousQuantity: savedStockMovement.previousQuantity,
        description: savedStockMovement.description,
        referenceType: savedStockMovement.referenceType,
        referenceId: savedStockMovement.referenceId,
        createdBy: savedStockMovement.createdBy,
        createdAt: savedStockMovement.createdAt,
        stock: {
          id: savedStock.id,
          quantity: savedStock.quantity,
          reserved: savedStock.reserved,
          available: savedStock.available,
          updatedAt: savedStock.updatedAt,
        },
      };
    });

    // Publicado só depois do commit, para não auditar uma movimentação desfeita.
    // events.created_by referencia users.username, então o autor vai pelo username.
    await this.eventPublisher.publish(
      new StockAdjustedEvent(result.stock.id, input.createdByUsername, {
        productId: result.productId,
        oldQuantity: result.previousQuantity,
        newQuantity: result.stock.quantity,
        reason: result.description ?? undefined,
        movementId: result.id,
        movementType: result.movementType,
        quantity: result.quantity,
      }),
    );

    return result;
  }
}
