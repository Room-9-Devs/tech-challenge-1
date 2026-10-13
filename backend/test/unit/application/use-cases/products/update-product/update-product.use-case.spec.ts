import { UpdateProductUseCase } from '@/application/use-cases/products/update-product/update-product.use-case';
import { FakeProductRepository } from '../../../../../fakes/fake-product.repository';
import { FakeStockRepository } from '../../../../../fakes/fake-stock.repository';
import { ProductNotFoundError } from '@/domain/errors/product-not-found.error';
import { ProductAlreadyExistsError } from '@/domain/errors/product-already-exists.error';
import { ProductUnitChangeWithStockError } from '@/domain/errors/product-unit-change-with-stock.error';
import { InvalidProductError } from '@/domain/errors/invalid-product.error';
import {
  Product,
  ProductType,
  ProductUnit,
} from '@/domain/entities/product.entity';
import { Stock } from '@/domain/entities/stock.entity';
import { ProductUpdatedEvent } from '@/domain/events/product.events';
import { FakeDomainEventPublisher } from '../../../../../fakes/fake-domain-event-publisher';

describe('UpdateProductUseCase', () => {
  let useCase: UpdateProductUseCase;
  let fakeRepository: FakeProductRepository;
  let fakeStockRepository: FakeStockRepository;
  let eventPublisher: FakeDomainEventPublisher;

  const createProduct = (sku: string): Product =>
    Product.create({
      sku,
      name: 'Pastilha de freio',
      productType: ProductType.PART,
      unit: ProductUnit.UNIT,
      cost: 100,
      salePrice: 150,
    });

  const updateData = {
    sku: 'PAST-FREIO-02',
    name: 'Pastilha de freio cerâmica',
    description: 'Pastilha de freio dianteira',
    productType: ProductType.PART,
    unit: ProductUnit.UNIT,
    cost: 120,
    salePrice: 190,
  };

  beforeEach(() => {
    fakeRepository = new FakeProductRepository();
    fakeStockRepository = new FakeStockRepository(fakeRepository);
    eventPublisher = new FakeDomainEventPublisher();
    useCase = new UpdateProductUseCase(
      fakeRepository,
      eventPublisher,
      fakeStockRepository,
    );
  });

  it('should update an product with valid data', async () => {
    const product = createProduct('PAST-FREIO-01');
    await fakeRepository.save(product);

    const result = await useCase.execute({ id: product.id, ...updateData });

    expect(result.id).toBe(product.id);
    expect(result.sku).toBe('PAST-FREIO-02');
    expect(result.name).toBe('Pastilha de freio cerâmica');
    expect(result.description).toBe('Pastilha de freio dianteira');
    expect(result.cost).toBe(120);
    expect(result.salePrice).toBe(190);
    expect(result.active).toBe(true);
  });

  it('should allow updating with the same sku', async () => {
    const product = createProduct('PAST-FREIO-01');
    await fakeRepository.save(product);

    const result = await useCase.execute({
      id: product.id,
      ...updateData,
      sku: 'PAST-FREIO-01',
    });

    expect(result.sku).toBe('PAST-FREIO-01');
    expect(result.salePrice).toBe(190);
  });

  it('should throw ProductNotFoundError when product does not exist', async () => {
    await expect(
      useCase.execute({ id: 'non-existent-id', ...updateData }),
    ).rejects.toThrow(ProductNotFoundError);
  });

  it('should throw ProductNotFoundError when product is inactive', async () => {
    const product = createProduct('PAST-FREIO-01');
    product.deactivate();
    await fakeRepository.save(product);

    await expect(
      useCase.execute({ id: product.id, ...updateData }),
    ).rejects.toThrow(ProductNotFoundError);
  });

  it('should throw ProductAlreadyExistsError when sku is already used by another product', async () => {
    const product1 = createProduct('PAST-FREIO-01');
    const product2 = createProduct('PAST-FREIO-02');
    await fakeRepository.save(product1);
    await fakeRepository.save(product2);

    await expect(
      useCase.execute({ id: product1.id, ...updateData, sku: 'PAST-FREIO-02' }),
    ).rejects.toThrow(ProductAlreadyExistsError);
  });

  it('should throw InvalidProductError when data is invalid', async () => {
    const product = createProduct('PAST-FREIO-01');
    await fakeRepository.save(product);

    await expect(
      useCase.execute({ id: product.id, ...updateData, salePrice: -1 }),
    ).rejects.toThrow(InvalidProductError);
  });

  describe('unit and product type changes', () => {
    it.each([
      ['unit', { unit: ProductUnit.LITER }],
      ['productType', { productType: ProductType.CONSUMABLE }],
    ])(
      'should throw ProductUnitChangeWithStockError when changing %s of a product with stock',
      async (_field, change) => {
        const product = createProduct('PAST-FREIO-01');
        await fakeRepository.save(product);
        await fakeStockRepository.save(
          Stock.reconstitute({ productId: product.id, quantity: 5, reserved: 0 }),
        );

        await expect(
          useCase.execute({ id: product.id, ...updateData, ...change }),
        ).rejects.toThrow(ProductUnitChangeWithStockError);

        const persisted = await fakeRepository.findById(product.id);
        expect(persisted!.unit).toBe(ProductUnit.UNIT);
        expect(persisted!.productType).toBe(ProductType.PART);
      },
    );

    it('should allow changing unit when stock has no balance', async () => {
      const product = createProduct('PAST-FREIO-01');
      await fakeRepository.save(product);
      await fakeStockRepository.save(
        Stock.reconstitute({ productId: product.id, quantity: 0, reserved: 0 }),
      );

      const result = await useCase.execute({
        id: product.id,
        ...updateData,
        unit: ProductUnit.LITER,
      });

      expect(result.unit).toBe(ProductUnit.LITER);
    });

    it('should allow other changes on a product with stock', async () => {
      const product = createProduct('PAST-FREIO-01');
      await fakeRepository.save(product);
      await fakeStockRepository.save(
        Stock.reconstitute({ productId: product.id, quantity: 5, reserved: 0 }),
      );

      const result = await useCase.execute({ id: product.id, ...updateData });

      expect(result.name).toBe('Pastilha de freio cerâmica');
    });
  });

  describe('ProductUpdatedEvent', () => {
    it('should list only the fields that actually changed', async () => {
      const product = createProduct('PAST-FREIO-01');
      await fakeRepository.save(product);

      await useCase.execute({
        id: product.id,
        sku: 'PAST-FREIO-01',
        name: 'Pastilha de freio',
        productType: ProductType.PART,
        unit: ProductUnit.UNIT,
        cost: 100,
        salePrice: 175,
      });

      const event = eventPublisher
        .getPublishedEvents()
        .find((e) => e instanceof ProductUpdatedEvent) as ProductUpdatedEvent;

      expect(event.metadata.changedFields).toEqual(['salePrice']);
    });

    it('should include description when it is removed from the request', async () => {
      const product = Product.create({
        sku: 'PAST-FREIO-01',
        name: 'Pastilha de freio',
        description: 'Descrição antiga',
        productType: ProductType.PART,
        unit: ProductUnit.UNIT,
        cost: 100,
        salePrice: 150,
      });
      await fakeRepository.save(product);

      await useCase.execute({
        id: product.id,
        sku: 'PAST-FREIO-01',
        name: 'Pastilha de freio',
        productType: ProductType.PART,
        unit: ProductUnit.UNIT,
        cost: 100,
        salePrice: 150,
      });

      const event = eventPublisher
        .getPublishedEvents()
        .find((e) => e instanceof ProductUpdatedEvent) as ProductUpdatedEvent;

      expect(event.metadata.changedFields).toEqual(['description']);
    });
  });
});
