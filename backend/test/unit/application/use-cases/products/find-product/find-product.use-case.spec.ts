import { FindProductUseCase } from '@/application/use-cases/products/find-product/find-product.use-case';
import { FakeProductRepository } from '../../../../../fakes/fake-product.repository';
import { ProductNotFoundError } from '@/domain/errors/product-not-found.error';
import {
  Product,
  ProductType,
  ProductUnit,
} from '@/domain/entities/product.entity';

describe('FindProductUseCase', () => {
  let useCase: FindProductUseCase;
  let fakeRepository: FakeProductRepository;

  const createProduct = (): Product =>
    Product.create({
      sku: 'PASTILHA-FREIO-01',
      name: 'Pastilha de freio',
      description: 'Jogo de pastilhas dianteiras',
      productType: ProductType.PART,
      unit: ProductUnit.UNIT,
      cost: 65,
      salePrice: 119,
    });

  beforeEach(() => {
    fakeRepository = new FakeProductRepository();
    useCase = new FindProductUseCase(fakeRepository);
  });

  it('should return product when it exists', async () => {
    const product = createProduct();
    await fakeRepository.save(product);

    const result = await useCase.execute({ id: product.id });

    expect(result.id).toBe(product.id);
    expect(result.sku).toBe('PASTILHA-FREIO-01');
    expect(result.name).toBe('Pastilha de freio');
    expect(result.description).toBe('Jogo de pastilhas dianteiras');
    expect(result.productType).toBe(ProductType.PART);
    expect(result.unit).toBe(ProductUnit.UNIT);
    expect(result.cost).toBe(65);
    expect(result.salePrice).toBe(119);
    expect(result.active).toBe(true);
  });

  it('should throw ProductNotFoundError when product does not exist', async () => {
    await expect(useCase.execute({ id: 'non-existent-id' })).rejects.toThrow(
      ProductNotFoundError,
    );
  });

  it('should throw ProductNotFoundError when product is inactive', async () => {
    const product = createProduct();
    product.deactivate();
    await fakeRepository.save(product);

    await expect(useCase.execute({ id: product.id })).rejects.toThrow(
      ProductNotFoundError,
    );
  });
});
