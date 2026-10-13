import { CreateStockMovementUseCase } from '@/application/use-cases/stock/create-stock-movement/create-stock-movement.use-case';
import { FakeProductRepository } from '../../../../../fakes/fake-product.repository';
import { FakeStockRepository } from '../../../../../fakes/fake-stock.repository';
import { FakeStockMovementRepository } from '../../../../../fakes/fake-stock-movement.repository';
import { FakeStockMovementUnitOfWork } from '../../../../../fakes/fake-stock-movement-unit-of-work';
import {
  Product,
  ProductType,
  ProductUnit,
} from '@/domain/entities/product.entity';
import { Stock } from '@/domain/entities/stock.entity';
import { StockMovementType } from '@/domain/entities/stock-movement.entity';
import { ProductNotFoundError } from '@/domain/errors/product-not-found.error';
import { StockNotFoundError } from '@/domain/errors/stock-not-found.error';
import { InsufficientStockError } from '@/domain/errors/insufficient-stock.error';
import { StockBelowReservedError } from '@/domain/errors/stock-below-reserved.error';
import { InvalidStockMovementError } from '@/domain/errors/invalid-stock-movement.error';
import { StockAdjustedEvent } from '@/domain/events/stock.events';
import { FakeDomainEventPublisher } from '../../../../../fakes/fake-domain-event-publisher';

describe('CreateStockMovementUseCase', () => {
  let useCase: CreateStockMovementUseCase;
  let fakeProductRepository: FakeProductRepository;
  let fakeStockRepository: FakeStockRepository;
  let fakeStockMovementRepository: FakeStockMovementRepository;
  let eventPublisher: FakeDomainEventPublisher;
  let product: Product;

  const userId = '660e8400-e29b-41d4-a716-446655440000';

  beforeEach(async () => {
    fakeProductRepository = new FakeProductRepository();
    fakeStockRepository = new FakeStockRepository(fakeProductRepository);
    fakeStockMovementRepository = new FakeStockMovementRepository(
      fakeProductRepository,
    );
    eventPublisher = new FakeDomainEventPublisher();
    useCase = new CreateStockMovementUseCase(
      fakeProductRepository,
      new FakeStockMovementUnitOfWork(
        fakeStockRepository,
        fakeStockMovementRepository,
      ),
      eventPublisher,
    );

    product = Product.create({
      sku: 'OLEO-5W30-1L',
      name: 'Óleo 5W30 sintético',
      productType: ProductType.CONSUMABLE,
      unit: ProductUnit.LITER,
      cost: 35.9,
      salePrice: 59.9,
    });

    await fakeProductRepository.save(product);
  });

  const addStock = (quantity: number, reserved = 0): void => {
    fakeStockRepository.add(
      Stock.reconstitute({ productId: product.id, quantity, reserved }),
    );
  };

  const currentQuantity = async (): Promise<number> =>
    (await fakeStockRepository.findByProductId(product.id))!.quantity;

  describe('IN', () => {
    it('should register the movement and increase the stock quantity', async () => {
      addStock(10);

      const result = await useCase.execute({
        productId: product.id,
        movementType: StockMovementType.IN,
        quantity: 5,
        description: 'Entrada de 5 litros de óleo 5W30',
        createdBy: userId,
      });

      expect(result.id).toBeDefined();
      expect(result.productId).toBe(product.id);
      expect(result.movementType).toBe(StockMovementType.IN);
      expect(result.quantity).toBe(5);
      expect(result.previousQuantity).toBe(10);
      expect(result.description).toBe('Entrada de 5 litros de óleo 5W30');
      expect(result.referenceType).toBeNull();
      expect(result.referenceId).toBeNull();
      expect(result.createdBy).toBe(userId);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.stock.quantity).toBe(15);
      expect(result.stock.available).toBe(15);

      expect(await currentQuantity()).toBe(15);

      const movements = fakeStockMovementRepository.items();
      expect(movements).toHaveLength(1);
      expect(movements[0].id).toBe(result.id);
      expect(movements[0].previousQuantity).toBe(10);
    });

    it('should store reference type and reference id', async () => {
      addStock(0);

      const result = await useCase.execute({
        productId: product.id,
        movementType: StockMovementType.IN,
        quantity: 1,
        referenceType: 'WORK_ORDER',
        referenceId: '770e8400-e29b-41d4-a716-446655440000',
        createdBy: userId,
      });

      expect(result.referenceType).toBe('WORK_ORDER');
      expect(result.referenceId).toBe('770e8400-e29b-41d4-a716-446655440000');
    });
  });

  describe('OUT', () => {
    it('should register the movement and decrease the stock quantity', async () => {
      addStock(10);

      const result = await useCase.execute({
        productId: product.id,
        movementType: StockMovementType.OUT,
        quantity: 4,
        createdBy: userId,
      });

      expect(result.movementType).toBe(StockMovementType.OUT);
      expect(result.quantity).toBe(4);
      expect(result.previousQuantity).toBe(10);
      expect(result.stock.quantity).toBe(6);

      expect(await currentQuantity()).toBe(6);
      expect(fakeStockMovementRepository.items()).toHaveLength(1);
    });

    it('should throw InsufficientStockError when quantity is greater than available', async () => {
      addStock(10);

      await expect(
        useCase.execute({
          productId: product.id,
          movementType: StockMovementType.OUT,
          quantity: 15,
          createdBy: userId,
        }),
      ).rejects.toThrow(InsufficientStockError);

      expect(await currentQuantity()).toBe(10);
      expect(fakeStockMovementRepository.items()).toHaveLength(0);
    });

    it('should allow OUT up to the quantity not reserved', async () => {
      addStock(10, 5);

      const result = await useCase.execute({
        productId: product.id,
        movementType: StockMovementType.OUT,
        quantity: 5,
        createdBy: userId,
      });

      expect(result.stock.quantity).toBe(5);
      expect(result.stock.reserved).toBe(5);
      expect(result.stock.available).toBe(0);
    });

    it('should throw InsufficientStockError when OUT would consume reserved quantity', async () => {
      addStock(10, 5);

      await expect(
        useCase.execute({
          productId: product.id,
          movementType: StockMovementType.OUT,
          quantity: 6,
          createdBy: userId,
        }),
      ).rejects.toThrow(InsufficientStockError);

      expect(await currentQuantity()).toBe(10);
      expect(fakeStockMovementRepository.items()).toHaveLength(0);
    });
  });

  describe('ADJUSTMENT', () => {
    it('should register the movement and set the stock quantity', async () => {
      addStock(10, 2);

      const result = await useCase.execute({
        productId: product.id,
        movementType: StockMovementType.ADJUSTMENT,
        quantity: 7,
        description: 'Contagem de inventário',
        createdBy: userId,
      });

      expect(result.movementType).toBe(StockMovementType.ADJUSTMENT);
      expect(result.quantity).toBe(7);
      expect(result.previousQuantity).toBe(10);
      expect(result.stock.quantity).toBe(7);
      expect(result.stock.reserved).toBe(2);
      expect(result.stock.available).toBe(5);

      expect(await currentQuantity()).toBe(7);
      expect(fakeStockMovementRepository.items()).toHaveLength(1);
    });

    it('should allow adjusting the stock to zero when nothing is reserved', async () => {
      addStock(10);

      const result = await useCase.execute({
        productId: product.id,
        movementType: StockMovementType.ADJUSTMENT,
        quantity: 0,
        createdBy: userId,
      });

      expect(result.stock.quantity).toBe(0);
    });

    it('should throw StockBelowReservedError when adjusting below the reserved quantity', async () => {
      addStock(10, 5);

      await expect(
        useCase.execute({
          productId: product.id,
          movementType: StockMovementType.ADJUSTMENT,
          quantity: 4,
          createdBy: userId,
        }),
      ).rejects.toThrow(StockBelowReservedError);

      expect(await currentQuantity()).toBe(10);
      expect(fakeStockMovementRepository.items()).toHaveLength(0);
    });
  });

  describe('validation', () => {
    it('should throw ProductNotFoundError when product does not exist', async () => {
      await expect(
        useCase.execute({
          productId: 'non-existent-id',
          movementType: StockMovementType.IN,
          quantity: 1,
          createdBy: userId,
        }),
      ).rejects.toThrow(ProductNotFoundError);

      expect(fakeStockMovementRepository.items()).toHaveLength(0);
    });

    it('should throw ProductNotFoundError when product is inactive', async () => {
      addStock(0);
      product.deactivate();
      await fakeProductRepository.save(product);

      await expect(
        useCase.execute({
          productId: product.id,
          movementType: StockMovementType.IN,
          quantity: 1,
          createdBy: userId,
        }),
      ).rejects.toThrow(ProductNotFoundError);
    });

    it('should throw StockNotFoundError when the product has no stock record', async () => {
      await expect(
        useCase.execute({
          productId: product.id,
          movementType: StockMovementType.IN,
          quantity: 1,
          createdBy: userId,
        }),
      ).rejects.toThrow(StockNotFoundError);

      expect(await fakeStockRepository.findByProductId(product.id)).toBeNull();
      expect(fakeStockMovementRepository.items()).toHaveLength(0);
    });

    it.each([0, -1, 1.5])(
      'should throw InvalidStockMovementError for invalid quantity %p',
      async (quantity) => {
        addStock(10);

        await expect(
          useCase.execute({
            productId: product.id,
            movementType: StockMovementType.IN,
            quantity,
            createdBy: userId,
          }),
        ).rejects.toThrow(InvalidStockMovementError);

        expect(await currentQuantity()).toBe(10);
        expect(fakeStockMovementRepository.items()).toHaveLength(0);
      },
    );
  });

  describe('consistency', () => {
    it('should propagate repository errors when loading the product', async () => {
      jest
        .spyOn(fakeProductRepository, 'findById')
        .mockRejectedValueOnce(new Error('Database unavailable'));

      await expect(
        useCase.execute({
          productId: product.id,
          movementType: StockMovementType.IN,
          quantity: 1,
          createdBy: userId,
        }),
      ).rejects.toThrow('Database unavailable');

      expect(fakeStockMovementRepository.items()).toHaveLength(0);
    });

    it('should not register the movement when updating the stock fails', async () => {
      addStock(10);
      jest
        .spyOn(fakeStockRepository, 'save')
        .mockRejectedValueOnce(new Error('Failed to update stock'));

      await expect(
        useCase.execute({
          productId: product.id,
          movementType: StockMovementType.IN,
          quantity: 5,
          createdBy: userId,
        }),
      ).rejects.toThrow('Failed to update stock');

      expect(await currentQuantity()).toBe(10);
      expect(fakeStockMovementRepository.items()).toHaveLength(0);
    });

    it('should roll back the stock update when registering the movement fails', async () => {
      addStock(10);
      jest
        .spyOn(fakeStockMovementRepository, 'save')
        .mockRejectedValueOnce(new Error('Failed to register movement'));

      await expect(
        useCase.execute({
          productId: product.id,
          movementType: StockMovementType.OUT,
          quantity: 4,
          createdBy: userId,
        }),
      ).rejects.toThrow('Failed to register movement');

      expect(await currentQuantity()).toBe(10);
      expect(fakeStockMovementRepository.items()).toHaveLength(0);
    });
  });

  describe('audit event', () => {
    it.each([
      [StockMovementType.IN, 5, 10, 15],
      [StockMovementType.OUT, 4, 10, 6],
      [StockMovementType.ADJUSTMENT, 3, 10, 3],
    ])(
      'should publish StockAdjustedEvent for %s movements',
      async (movementType, quantity, before, after) => {
        addStock(before);

        const result = await useCase.execute({
          productId: product.id,
          movementType,
          quantity,
          description: 'Contagem de inventário',
          createdBy: userId,
          createdByUsername: 'quiteria.dantas',
        });

        const events = eventPublisher.getPublishedEvents();
        expect(events).toHaveLength(1);

        const event = events[0] as StockAdjustedEvent;
        expect(event).toBeInstanceOf(StockAdjustedEvent);
        expect(event.entityId).toBe(result.stock.id);
        expect(event.createdBy).toBe('quiteria.dantas');
        expect(event.metadata).toEqual({
          productId: product.id,
          oldQuantity: before,
          newQuantity: after,
          reason: 'Contagem de inventário',
          movementId: result.id,
          movementType,
          quantity,
        });
      },
    );

    it('should not publish an event when the movement is rejected', async () => {
      addStock(2);

      await expect(
        useCase.execute({
          productId: product.id,
          movementType: StockMovementType.OUT,
          quantity: 5,
          createdBy: userId,
        }),
      ).rejects.toThrow(InsufficientStockError);

      expect(eventPublisher.getPublishedEvents()).toHaveLength(0);
    });

    it('should not publish an event when the transaction is rolled back', async () => {
      addStock(10);
      jest
        .spyOn(fakeStockMovementRepository, 'save')
        .mockRejectedValueOnce(new Error('Failed to register movement'));

      await expect(
        useCase.execute({
          productId: product.id,
          movementType: StockMovementType.IN,
          quantity: 1,
          createdBy: userId,
        }),
      ).rejects.toThrow('Failed to register movement');

      expect(eventPublisher.getPublishedEvents()).toHaveLength(0);
    });
  });
});
