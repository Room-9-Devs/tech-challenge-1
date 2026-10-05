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

  it('should return list of products', async () => {
    await fakeRepository.save(
      createProduct('PAST-FREIO-01', 'Pastilha de freio'),
    );
    await fakeRepository.save(
      createProduct('FILTRO-OLEO-01', 'Filtro de óleo'),
    );

    const result = await useCase.execute();

    expect(result.products).toHaveLength(2);
    expect(result.products[0].sku).toBe('PAST-FREIO-01');
    expect(result.products[1].sku).toBe('FILTRO-OLEO-01');
  });

  it('should return empty list when no products exist', async () => {
    const result = await useCase.execute();

    expect(result.products).toEqual([]);
  });

  it('should not return inactive products', async () => {
    const activeProduct = createProduct('PAST-FREIO-01', 'Pastilha de freio');
    const inactiveProduct = createProduct('FILTRO-OLEO-01', 'Filtro de óleo');
    inactiveProduct.deactivate();

    await fakeRepository.save(activeProduct);
    await fakeRepository.save(inactiveProduct);

    const result = await useCase.execute();

    expect(result.products).toHaveLength(1);
    expect(result.products[0].id).toBe(activeProduct.id);
  });
});
