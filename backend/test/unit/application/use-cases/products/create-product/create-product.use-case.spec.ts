import { CreateProductUseCase } from '@/application/use-cases/products/create-product/create-product.use-case';
import { FakeProductRepository } from '../../../../../fakes/fake-product.repository';
import { FakeStockRepository } from '../../../../../fakes/fake-stock.repository';
import { FakeProductCreationUnitOfWork } from '../../../../../fakes/fake-product-creation-unit-of-work';
import { ProductAlreadyExistsError } from '@/domain/errors/product-already-exists.error';
import { InvalidProductError } from '@/domain/errors/invalid-product.error';
import {
  Product,
  ProductType,
  ProductUnit,
} from '@/domain/entities/product.entity';
import { FakeDomainEventPublisher } from '../../../../../fakes/fake-domain-event-publisher';
import { ProductCreatedEvent } from '@/domain/events/product.events';

describe('CreateProductUseCase', () => {
  let useCase: CreateProductUseCase;
  let fakeRepository: FakeProductRepository;
  let fakeStockRepository: FakeStockRepository;
  let fakeEventPublisher: FakeDomainEventPublisher;

  const input = {
    sku: 'OLEO-5W30-1L',
    name: 'Óleo 5W30 sintético',
    description: 'Óleo lubrificante sintético',
    productType: ProductType.CONSUMABLE,
    unit: ProductUnit.LITER,
    cost: 35.9,
    salePrice: 59.9,
  };

  beforeEach(() => {
    fakeRepository = new FakeProductRepository();
    fakeStockRepository = new FakeStockRepository(fakeRepository);
    fakeEventPublisher = new FakeDomainEventPublisher();
    useCase = new CreateProductUseCase(
      fakeRepository,
      fakeEventPublisher,
      new FakeDomainEventPublisher(),
      new FakeProductCreationUnitOfWork(fakeRepository, fakeStockRepository),
    );
  });

  it('should create an active product with valid data', async () => {
    const result = await useCase.execute(input);

    expect(result.id).toBeDefined();
    expect(result.sku).toBe('OLEO-5W30-1L');
    expect(result.name).toBe('Óleo 5W30 sintético');
    expect(result.productType).toBe(ProductType.CONSUMABLE);
    expect(result.unit).toBe(ProductUnit.LITER);
    expect(result.cost).toBe(35.9);
    expect(result.salePrice).toBe(59.9);
    expect(result.active).toBe(true);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('should persist product through repository', async () => {
    const result = await useCase.execute(input);

    const persistedProduct = await fakeRepository.findById(result.id);

    expect(persistedProduct).not.toBeNull();
    expect(persistedProduct!.sku).toBe('OLEO-5W30-1L');
  });

  it('should create an empty stock for the product', async () => {
    const result = await useCase.execute(input);

    const stock = await fakeStockRepository.findByProductId(result.id);

    expect(stock).not.toBeNull();
    expect(stock!.quantity).toBe(0);
    expect(stock!.reserved).toBe(0);
  });

  it('should not persist the product when creating the stock fails', async () => {
    jest
      .spyOn(fakeStockRepository, 'save')
      .mockRejectedValueOnce(new Error('Failed to create stock'));

    await expect(useCase.execute(input)).rejects.toThrow(
      'Failed to create stock',
    );

    expect(await fakeRepository.findBySku(input.sku)).toBeNull();
  });

  it('should throw ProductAlreadyExistsError when sku already exists', async () => {
    await useCase.execute(input);

    await expect(
      useCase.execute({ ...input, name: 'Outro óleo' }),
    ).rejects.toThrow(ProductAlreadyExistsError);
  });

  it('should throw ProductAlreadyExistsError when sku belongs to an inactive product', async () => {
    const product = Product.create(input);
    product.deactivate();
    await fakeRepository.save(product);

    await expect(useCase.execute(input)).rejects.toThrow(
      ProductAlreadyExistsError,
    );
  });

  it('should publish ProductCreatedEvent with the author', async () => {
    const result = await useCase.execute({ ...input, createdBy: 'jose.silveira' });

    const events = fakeEventPublisher.getPublishedEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(ProductCreatedEvent);
    expect(events[0]).toMatchObject({
      entityId: result.id,
      createdBy: 'jose.silveira',
      metadata: { sku: 'OLEO-5W30-1L', salePrice: 59.9 },
    });
  });

  it('should not publish events when creation fails', async () => {
    await expect(useCase.execute({ ...input, name: '' })).rejects.toThrow(
      InvalidProductError,
    );
    expect(fakeEventPublisher.getPublishedEvents()).toHaveLength(0);
  });

  it('should throw InvalidProductError when name is invalid', async () => {
    await expect(useCase.execute({ ...input, name: '' })).rejects.toThrow(
      InvalidProductError,
    );
  });

  it('should throw InvalidProductError when cost is negative', async () => {
    await expect(useCase.execute({ ...input, cost: -10 })).rejects.toThrow(
      InvalidProductError,
    );
  });

  it('should propagate repository errors', async () => {
    jest
      .spyOn(fakeRepository, 'save')
      .mockRejectedValueOnce(new Error('Database error'));

    await expect(useCase.execute(input)).rejects.toThrow('Database error');
  });
});
