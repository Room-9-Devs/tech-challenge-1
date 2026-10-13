import { ActivateProductUseCase } from '@/application/use-cases/products/activate-product/activate-product.use-case';
import { FakeProductRepository } from '../../../../../fakes/fake-product.repository';
import { ProductNotFoundError } from '@/domain/errors/product-not-found.error';
import { ProductAlreadyActiveError } from '@/domain/errors/product-already-active.error';
import {
  Product,
  ProductType,
  ProductUnit,
} from '@/domain/entities/product.entity';

describe('ActivateProductUseCase', () => {
  let useCase: ActivateProductUseCase;
  let fakeRepository: FakeProductRepository;

  const createProduct = (): Product =>
    Product.create({
      sku: 'FILTRO-OLEO-01',
      name: 'Filtro de óleo',
      productType: ProductType.PART,
      unit: ProductUnit.UNIT,
      cost: 25,
      salePrice: 45,
    });

  beforeEach(() => {
    fakeRepository = new FakeProductRepository();
    useCase = new ActivateProductUseCase(fakeRepository);
  });

  it('should reactivate a deactivated product', async () => {
    const product = createProduct();
    product.deactivate();
    await fakeRepository.save(product);

    const result = await useCase.execute({ id: product.id });

    expect(result.id).toBe(product.id);
    expect(result.sku).toBe('FILTRO-OLEO-01');
    expect(result.active).toBe(true);
  });

  it('should make the product visible again after reactivation', async () => {
    const product = createProduct();
    product.deactivate();
    await fakeRepository.save(product);

    expect(await fakeRepository.findById(product.id)).toBeNull();

    await useCase.execute({ id: product.id });

    expect(await fakeRepository.findById(product.id)).not.toBeNull();
  });

  it('should throw ProductAlreadyActiveError when product is already active', async () => {
    const product = createProduct();
    await fakeRepository.save(product);

    await expect(useCase.execute({ id: product.id })).rejects.toThrow(
      ProductAlreadyActiveError,
    );
  });

  it('should throw ProductNotFoundError when product does not exist', async () => {
    await expect(useCase.execute({ id: 'non-existent-id' })).rejects.toThrow(
      ProductNotFoundError,
    );
  });
});
