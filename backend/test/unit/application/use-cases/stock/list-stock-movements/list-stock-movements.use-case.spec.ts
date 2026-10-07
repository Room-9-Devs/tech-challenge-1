import { ListStockMovementsUseCase } from '@/application/use-cases/stock/list-stock-movements/list-stock-movements.use-case';
import { FakeProductRepository } from '../../../../../fakes/fake-product.repository';
import { FakeStockMovementRepository } from '../../../../../fakes/fake-stock-movement.repository';
import {
  Product,
  ProductType,
  ProductUnit,
} from '@/domain/entities/product.entity';
import {
  StockMovement,
  StockMovementType,
} from '@/domain/entities/stock-movement.entity';

describe('ListStockMovementsUseCase', () => {
  let useCase: ListStockMovementsUseCase;
  let fakeProductRepository: FakeProductRepository;
  let fakeStockMovementRepository: FakeStockMovementRepository;
  let oil: Product;
  let filter: Product;

  const userId = '660e8400-e29b-41d4-a716-446655440000';
  const otherUserId = '770e8400-e29b-41d4-a716-446655440000';

  const createProduct = async (sku: string, name: string): Promise<Product> => {
    const product = Product.create({
      sku,
      name,
      productType: ProductType.PART,
      unit: ProductUnit.UNIT,
      cost: 100,
      salePrice: 150,
    });
    await fakeProductRepository.save(product);
    return product;
  };

  const addMovement = async (
    product: Product,
    movementType: StockMovementType,
    quantity: number,
    previousQuantity: number,
    createdAt: string,
    createdBy = userId,
  ): Promise<StockMovement> =>
    fakeStockMovementRepository.save(
      StockMovement.reconstitute({
        productId: product.id,
        movementType,
        quantity,
        previousQuantity,
        createdBy,
        createdAt: new Date(createdAt),
      }),
    );

  beforeEach(async () => {
    fakeProductRepository = new FakeProductRepository();
    fakeStockMovementRepository = new FakeStockMovementRepository(
      fakeProductRepository,
    );
    useCase = new ListStockMovementsUseCase(fakeStockMovementRepository);

    oil = await createProduct('OLEO-5W30-1L', 'Óleo 5W30 sintético');
    filter = await createProduct('FILTRO-OLEO-01', 'Filtro de óleo');
  });

  it('should return the movements with product data from newest to oldest', async () => {
    const first = await addMovement(
      oil,
      StockMovementType.IN,
      10,
      0,
      '2026-10-01T10:00:00.000Z',
    );
    const second = await addMovement(
      oil,
      StockMovementType.OUT,
      4,
      10,
      '2026-10-02T10:00:00.000Z',
    );

    const result = await useCase.execute();

    expect(result.data.map((item) => item.id)).toEqual([second.id, first.id]);
    expect(result.data[0]).toEqual({
      id: second.id,
      productId: oil.id,
      product: {
        id: oil.id,
        sku: 'OLEO-5W30-1L',
        name: 'Óleo 5W30 sintético',
        productType: ProductType.PART,
        unit: ProductUnit.UNIT,
      },
      movementType: StockMovementType.OUT,
      quantity: 4,
      previousQuantity: 10,
      description: null,
      referenceType: null,
      referenceId: null,
      createdBy: userId,
      createdAt: new Date('2026-10-02T10:00:00.000Z'),
    });
    expect(result.meta).toEqual({
      page: 1,
      limit: 10,
      totalItems: 2,
      totalPages: 1,
    });
  });

  it('should return empty paginated list when no movement exists', async () => {
    const result = await useCase.execute();

    expect(result.data).toEqual([]);
    expect(result.meta.totalItems).toBe(0);
    expect(result.meta.totalPages).toBe(1);
  });

  it('should keep movements of inactive products in the history', async () => {
    await addMovement(oil, StockMovementType.IN, 10, 0, '2026-10-01T10:00:00.000Z');
    oil.deactivate();
    await fakeProductRepository.save(oil);

    const result = await useCase.execute();

    expect(result.data).toHaveLength(1);
  });

  it('should filter by product, movement type and creator', async () => {
    await addMovement(oil, StockMovementType.IN, 10, 0, '2026-10-01T10:00:00.000Z');
    const expected = await addMovement(
      oil,
      StockMovementType.OUT,
      2,
      10,
      '2026-10-02T10:00:00.000Z',
      otherUserId,
    );
    await addMovement(oil, StockMovementType.OUT, 1, 8, '2026-10-03T10:00:00.000Z');
    await addMovement(filter, StockMovementType.OUT, 1, 5, '2026-10-02T10:00:00.000Z', otherUserId);

    const result = await useCase.execute({
      filters: {
        productId: oil.id,
        movementType: StockMovementType.OUT,
        createdBy: otherUserId,
      },
    });

    expect(result.data.map((item) => item.id)).toEqual([expected.id]);
  });

  it('should filter by period', async () => {
    await addMovement(oil, StockMovementType.IN, 10, 0, '2026-09-30T23:59:59.000Z');
    const inside = await addMovement(oil, StockMovementType.OUT, 2, 10, '2026-10-15T10:00:00.000Z');
    await addMovement(oil, StockMovementType.OUT, 1, 8, '2026-11-01T00:00:01.000Z');

    const result = await useCase.execute({
      startDate: new Date('2026-10-01T00:00:00.000Z'),
      endDate: new Date('2026-10-31T23:59:59.999Z'),
    });

    expect(result.data.map((item) => item.id)).toEqual([inside.id]);
  });

  it('should search movements by product name', async () => {
    await addMovement(oil, StockMovementType.IN, 10, 0, '2026-10-01T10:00:00.000Z');
    await addMovement(filter, StockMovementType.IN, 5, 0, '2026-10-01T10:00:00.000Z');

    const result = await useCase.execute({ search: 'filtro' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].product.name).toBe('Filtro de óleo');
  });

  it('should paginate results', async () => {
    await addMovement(oil, StockMovementType.IN, 1, 0, '2026-10-01T10:00:00.000Z');
    await addMovement(oil, StockMovementType.IN, 1, 1, '2026-10-02T10:00:00.000Z');
    await addMovement(oil, StockMovementType.IN, 1, 2, '2026-10-03T10:00:00.000Z');

    const result = await useCase.execute({ page: 2, limit: 2 });

    expect(result.data).toHaveLength(1);
    expect(result.meta).toEqual({
      page: 2,
      limit: 2,
      totalItems: 3,
      totalPages: 2,
    });
  });

  it('should propagate repository errors', async () => {
    jest
      .spyOn(fakeStockMovementRepository, 'findAll')
      .mockRejectedValueOnce(new Error('Database unavailable'));

    await expect(useCase.execute()).rejects.toThrow('Database unavailable');
  });
});
