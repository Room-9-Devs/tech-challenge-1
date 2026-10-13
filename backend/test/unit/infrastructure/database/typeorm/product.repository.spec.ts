import { QueryFailedError } from 'typeorm';
import { Product, ProductType, ProductUnit } from '@/domain/entities/product.entity';
import { ProductMapper } from '@/infrastructure/database/typeorm/mappers/product.mapper';
import { TypeOrmProductRepository } from '@/infrastructure/database/typeorm/repositories/typeorm-product.repository';
import { ProductAlreadyExistsError } from '@/domain/errors/product-already-exists.error';

const product = () =>
  Product.create({
    sku: 'OLEO-5W30-1L',
    name: 'Óleo 5W30 sintético',
    productType: ProductType.CONSUMABLE,
    unit: ProductUnit.LITER,
    cost: 35.9,
    salePrice: 59.9,
  });

describe('TypeOrmProductRepository', () => {
  it('maps the persisted product back to the domain', async () => {
    const input = product();
    const repo = { save: jest.fn().mockResolvedValue(ProductMapper.toPersistence(input)) };

    const result = await new TypeOrmProductRepository(repo as never).save(input);

    expect(result.id).toBe(input.id);
    expect(result.sku).toBe('OLEO-5W30-1L');
  });

  it('maps a SKU conflict raised by PostgreSQL to 409', async () => {
    const failure = new QueryFailedError(
      'INSERT',
      [],
      Object.assign(new Error('duplicate'), { code: '23505' }),
    );
    const repo = { save: jest.fn().mockRejectedValue(failure) };

    await expect(
      new TypeOrmProductRepository(repo as never).save(product()),
    ).rejects.toThrow(ProductAlreadyExistsError);
  });

  it('does not hide unrelated database errors', async () => {
    const failure = new Error('database unavailable');
    const repo = { save: jest.fn().mockRejectedValue(failure) };

    await expect(
      new TypeOrmProductRepository(repo as never).save(product()),
    ).rejects.toBe(failure);
  });

  it('finds inactive products when requested', async () => {
    const input = product();
    input.deactivate();
    const repo = { findOne: jest.fn().mockResolvedValue(ProductMapper.toPersistence(input)) };

    const result = await new TypeOrmProductRepository(repo as never).findByIdIncludingInactive(
      input.id,
    );

    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: input.id } });
    expect(result!.active).toBe(false);
  });
});
