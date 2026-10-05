import { UpdateProductUseCase } from '@/application/use-cases/products/update-product/update-product.use-case';
import { FakeProductRepository } from '../../../../../fakes/fake-product.repository';
import { ProductNotFoundError } from '@/domain/errors/product-not-found.error';
import { ProductAlreadyExistsError } from '@/domain/errors/product-already-exists.error';
import { InvalidProductError } from '@/domain/errors/invalid-product.error';
import {
  Product,
  ProductType,
  ProductUnit,
} from '@/domain/entities/product.entity';

describe('UpdateProductUseCase', () => {
  let useCase: UpdateProductUseCase;
  let fakeRepository: FakeProductRepository;

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
    useCase = new UpdateProductUseCase(fakeRepository);
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
});
