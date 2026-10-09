import { ListStockUseCase } from '@/application/use-cases/stock/list-stock/list-stock.use-case';
import { FakeProductRepository } from '../../../../../fakes/fake-product.repository';
import { FakeStockRepository } from '../../../../../fakes/fake-stock.repository';
import {
  Product,
  ProductType,
  ProductUnit,
} from '@/domain/entities/product.entity';
import { Stock } from '@/domain/entities/stock.entity';

describe('ListStockUseCase', () => {
  let useCase: ListStockUseCase;
  let fakeProductRepository: FakeProductRepository;
  let fakeStockRepository: FakeStockRepository;

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

  const addStock = (product: Product, quantity: number, reserved = 0): Stock => {
    const stock = Stock.reconstitute({
      productId: product.id,
      quantity,
      reserved,
    });
    fakeStockRepository.add(stock);
    return stock;
  };

  beforeEach(() => {
    fakeProductRepository = new FakeProductRepository();
    fakeStockRepository = new FakeStockRepository(fakeProductRepository);
    useCase = new ListStockUseCase(fakeStockRepository);
  });

  it('should return the current stock with product data', async () => {
    const product = await createProduct('PAST-FREIO-01', 'Pastilha de freio');
    const stock = addStock(product, 30, 4);

    const result = await useCase.execute();

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toEqual({
      id: stock.id,
      productId: product.id,
      product: {
        id: product.id,
        sku: 'PAST-FREIO-01',
        name: 'Pastilha de freio',
        productType: ProductType.PART,
        unit: ProductUnit.UNIT,
      },
      quantity: 30,
      reserved: 4,
      available: 26,
      createdAt: stock.createdAt,
      updatedAt: stock.updatedAt,
    });
    expect(result.meta).toEqual({
      page: 1,
      limit: 10,
      totalItems: 1,
      totalPages: 1,
    });
  });

  it('should return empty paginated list when no stock exists', async () => {
    const result = await useCase.execute();

    expect(result.data).toEqual([]);
    expect(result.meta.totalItems).toBe(0);
    expect(result.meta.totalPages).toBe(1);
  });

  it('should not return stock of inactive products', async () => {
    const activeProduct = await createProduct('PAST-FREIO-01', 'Pastilha de freio');
    const inactiveProduct = await createProduct('FILTRO-OLEO-01', 'Filtro de óleo');
    addStock(activeProduct, 10);
    addStock(inactiveProduct, 0);
    inactiveProduct.deactivate();
    await fakeProductRepository.save(inactiveProduct);

    const result = await useCase.execute();

    expect(result.data).toHaveLength(1);
    expect(result.data[0].productId).toBe(activeProduct.id);
  });

  it('should paginate results', async () => {
    addStock(await createProduct('PROD-01', 'Produto 1'), 1);
    addStock(await createProduct('PROD-02', 'Produto 2'), 2);
    addStock(await createProduct('PROD-03', 'Produto 3'), 3);

    const result = await useCase.execute({ page: 2, limit: 2 });

    expect(result.data).toHaveLength(1);
    expect(result.meta).toEqual({
      page: 2,
      limit: 2,
      totalItems: 3,
      totalPages: 2,
    });
  });

  it('should search stock by product name', async () => {
    addStock(await createProduct('PAST-FREIO-01', 'Pastilha de freio'), 10);
    addStock(await createProduct('FILTRO-OLEO-01', 'Filtro de óleo'), 20);

    const result = await useCase.execute({ search: 'óleo' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].product.name).toBe('Filtro de óleo');
  });

  it('should filter stock by product', async () => {
    const product = await createProduct('PAST-FREIO-01', 'Pastilha de freio');
    addStock(product, 10);
    addStock(await createProduct('FILTRO-OLEO-01', 'Filtro de óleo'), 20);

    const result = await useCase.execute({
      filters: { productId: product.id },
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].productId).toBe(product.id);
  });

  it('should sort stock by quantity', async () => {
    addStock(await createProduct('PROD-01', 'Produto 1'), 30);
    addStock(await createProduct('PROD-02', 'Produto 2'), 10);
    addStock(await createProduct('PROD-03', 'Produto 3'), 20);

    const result = await useCase.execute({
      sort: [{ field: 'quantity', order: 'asc' }],
    });

    expect(result.data.map((item) => item.quantity)).toEqual([10, 20, 30]);
  });

  it('should propagate repository errors', async () => {
    jest
      .spyOn(fakeStockRepository, 'findAll')
      .mockRejectedValueOnce(new Error('Database unavailable'));

    await expect(useCase.execute()).rejects.toThrow('Database unavailable');
  });
});
