import { ListProductsUseCase } from '@/application/use-cases/products/list-products/list-products.use-case';
import { FakeProductRepository } from '../../../../../fakes/fake-product.repository';
import {
  Product,
  ProductType,
  ProductUnit,
} from '@/domain/entities/product.entity';

describe('ListProductsUseCase', () => {
  let useCase: ListProductsUseCase;
  let fakeRepository: FakeProductRepository;

  const createProduct = (sku: string, name: string): Product =>
    Product.create({
      sku,
      name,
      productType: ProductType.PART,
      unit: ProductUnit.UNIT,
      cost: 100,
      salePrice: 150,
    });

  beforeEach(() => {
    fakeRepository = new FakeProductRepository();
    useCase = new ListProductsUseCase(fakeRepository);
  });

  it('should return paginated list of products', async () => {
    await fakeRepository.save(
      createProduct('PAST-FREIO-01', 'Pastilha de freio'),
    );
    await fakeRepository.save(
      createProduct('FILTRO-OLEO-01', 'Filtro de óleo'),
    );

    const result = await useCase.execute();

    expect(result.data).toHaveLength(2);
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(10);
    expect(result.meta.totalItems).toBe(2);
    expect(result.meta.totalPages).toBe(1);
    expect(result.data[0].sku).toBe('PAST-FREIO-01');
    expect(result.data[1].sku).toBe('FILTRO-OLEO-01');
  });

  it('should return empty paginated list when no products exist', async () => {
    const result = await useCase.execute();

    expect(result.data).toEqual([]);
    expect(result.meta.totalItems).toBe(0);
    expect(result.meta.totalPages).toBe(1);
  });

  it('should not return inactive products by default', async () => {
    const activeProduct = createProduct('PAST-FREIO-01', 'Pastilha de freio');
    const inactiveProduct = createProduct('FILTRO-OLEO-01', 'Filtro de óleo');
    inactiveProduct.deactivate();

    await fakeRepository.save(activeProduct);
    await fakeRepository.save(inactiveProduct);

    const result = await useCase.execute();

    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe(activeProduct.id);
  });

  it('should paginate results', async () => {
    await fakeRepository.save(createProduct('PROD-01', 'Produto 1'));
    await fakeRepository.save(createProduct('PROD-02', 'Produto 2'));
    await fakeRepository.save(createProduct('PROD-03', 'Produto 3'));

    const result = await useCase.execute({ page: 2, limit: 2 });

    expect(result.data).toHaveLength(1);
    expect(result.meta.page).toBe(2);
    expect(result.meta.limit).toBe(2);
    expect(result.meta.totalItems).toBe(3);
    expect(result.meta.totalPages).toBe(2);
  });

  it('should search products by name', async () => {
    await fakeRepository.save(createProduct('PAST-FREIO-01', 'Pastilha de freio'));
    await fakeRepository.save(createProduct('FILTRO-OLEO-01', 'Filtro de óleo'));

    const result = await useCase.execute({ search: 'óleo' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe('Filtro de óleo');
  });

  it('should filter products dynamically by field', async () => {
    const part = createProduct('PART-01', 'Peça');
    const consumable = Product.create({
      sku: 'CONS-01',
      name: 'Consumível',
      productType: ProductType.CONSUMABLE,
      unit: ProductUnit.UNIT,
      cost: 100,
      salePrice: 150,
    });

    await fakeRepository.save(part);
    await fakeRepository.save(consumable);

    const result = await useCase.execute({
      filters: { productType: ProductType.PART },
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].productType).toBe(ProductType.PART);
  });
});
