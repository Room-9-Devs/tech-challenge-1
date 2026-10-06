import { DeleteProductUseCase } from '@/application/use-cases/products/delete-product/delete-product.use-case';
import { FakeProductRepository } from '../../../../../fakes/fake-product.repository';
import { FakeStockRepository } from '../../../../../fakes/fake-stock.repository';
import { ProductNotFoundError } from '@/domain/errors/product-not-found.error';
import { ProductHasStockError } from '@/domain/errors/product-has-stock.error';
import {
  Product,
  ProductType,
  ProductUnit,
} from '@/domain/entities/product.entity';
import { Stock } from '@/domain/entities/stock.entity';

describe('DeleteProductUseCase', () => {
  let useCase: DeleteProductUseCase;
  let fakeProductRepository: FakeProductRepository;
  let fakeStockRepository: FakeStockRepository;
  let product: Product;

  beforeEach(async () => {
    fakeProductRepository = new FakeProductRepository();
    fakeStockRepository = new FakeStockRepository();
    useCase = new DeleteProductUseCase(
      fakeProductRepository,
      fakeStockRepository,
    );

    product = Product.create({
      sku: 'PAST-FREIO-01',
      name: 'Pastilha de freio',
      productType: ProductType.PART,
      unit: ProductUnit.UNIT,
      cost: 100,
      salePrice: 150,
    });

    await fakeProductRepository.save(product);
  });

  it('should deactivate an product without stock record', async () => {
    await useCase.execute({ id: product.id });

    const foundProduct = await fakeProductRepository.findById(product.id);
    const persistedProduct = await fakeProductRepository.findBySku(product.sku);

    expect(foundProduct).toBeNull();
    expect(persistedProduct).not.toBeNull();
    expect(persistedProduct!.active).toBe(false);
  });

  it('should deactivate an product with empty stock', async () => {
    fakeStockRepository.add(
      Stock.reconstitute({ productId: product.id, quantity: 0, reserved: 0 }),
    );

    await useCase.execute({ id: product.id });

    const persistedProduct = await fakeProductRepository.findBySku(product.sku);
    expect(persistedProduct!.active).toBe(false);
  });

  it('should throw ProductHasStockError when product has quantity in stock', async () => {
    fakeStockRepository.add(
      Stock.reconstitute({ productId: product.id, quantity: 5, reserved: 0 }),
    );

    await expect(useCase.execute({ id: product.id })).rejects.toThrow(
      ProductHasStockError,
    );

    const persistedProduct = await fakeProductRepository.findById(product.id);
    expect(persistedProduct!.active).toBe(true);
  });

  it('should throw ProductHasStockError when product has reserved stock', async () => {
    fakeStockRepository.add(
      Stock.reconstitute({ productId: product.id, quantity: 0, reserved: 2 }),
    );

    await expect(useCase.execute({ id: product.id })).rejects.toThrow(
      ProductHasStockError,
    );
  });

  it('should throw ProductNotFoundError when product does not exist', async () => {
    await expect(useCase.execute({ id: 'non-existent-id' })).rejects.toThrow(
      ProductNotFoundError,
    );
  });

  it('should throw ProductNotFoundError when product is already inactive', async () => {
    await useCase.execute({ id: product.id });

    await expect(useCase.execute({ id: product.id })).rejects.toThrow(
      ProductNotFoundError,
    );
  });
});
