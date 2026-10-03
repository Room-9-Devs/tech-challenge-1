import {
  Product,
  ProductType,
  ProductUnit,
} from '@/domain/entities/product.entity';
import { InvalidProductError } from '@/domain/errors/invalid-product.error';

describe('Product Entity', () => {
  const validProps = {
    sku: 'OLEO-5W30-1L',
    name: 'Óleo 5W30 sintético',
    description: 'Óleo lubrificante sintético',
    productType: ProductType.CONSUMABLE,
    unit: ProductUnit.LITER,
    cost: 35.9,
    salePrice: 59.9,
  };

  describe('create', () => {
    it('should create an active product with valid data', () => {
      const product = Product.create(validProps);

      expect(product).toBeInstanceOf(Product);
      expect(product.id).toBeDefined();
      expect(product.sku).toBe('OLEO-5W30-1L');
      expect(product.name).toBe('Óleo 5W30 sintético');
      expect(product.description).toBe('Óleo lubrificante sintético');
      expect(product.productType).toBe(ProductType.CONSUMABLE);
      expect(product.unit).toBe(ProductUnit.LITER);
      expect(product.cost).toBe(35.9);
      expect(product.salePrice).toBe(59.9);
      expect(product.active).toBe(true);
      expect(product.createdAt).toBeInstanceOf(Date);
      expect(product.updatedAt).toBeInstanceOf(Date);
    });

    it('should set description to null when it is not provided', () => {
      const product = Product.create({ ...validProps, description: undefined });

      expect(product.description).toBeNull();
    });

    it('should throw InvalidProductError when sku is empty', () => {
      expect(() => Product.create({ ...validProps, sku: '' })).toThrow(
        InvalidProductError,
      );
    });

    it('should throw InvalidProductError when sku is too long', () => {
      expect(() =>
        Product.create({ ...validProps, sku: 'A'.repeat(101) }),
      ).toThrow(InvalidProductError);
    });

    it('should throw InvalidProductError when name is too short', () => {
      expect(() => Product.create({ ...validProps, name: 'A' })).toThrow(
        InvalidProductError,
      );
    });

    it('should throw InvalidProductError when description is too long', () => {
      expect(() =>
        Product.create({ ...validProps, description: 'A'.repeat(256) }),
      ).toThrow(InvalidProductError);
    });

    it('should throw InvalidProductError when product type is invalid', () => {
      expect(() =>
        Product.create({
          ...validProps,
          productType: 'INVALID' as ProductType,
        }),
      ).toThrow(InvalidProductError);
    });

    it('should throw InvalidProductError when unit is invalid', () => {
      expect(() =>
        Product.create({ ...validProps, unit: 'INVALID' as ProductUnit }),
      ).toThrow(InvalidProductError);
    });

    it('should throw InvalidProductError when cost is negative', () => {
      expect(() => Product.create({ ...validProps, cost: -1 })).toThrow(
        InvalidProductError,
      );
    });

    it('should throw InvalidProductError when sale price is not a number', () => {
      expect(() =>
        Product.create({ ...validProps, salePrice: Number('invalid') }),
      ).toThrow(InvalidProductError);
    });
  });

  describe('change methods', () => {
    it('should update product fields', () => {
      const product = Product.create(validProps);

      product.changeSku('OLEO-5W40-1L');
      product.changeName('Óleo 5W40 sintético');
      product.changeDescription(null);
      product.changeProductType(ProductType.PART);
      product.changeUnit(ProductUnit.UNIT);
      product.changeCost(40);
      product.changeSalePrice(70);

      expect(product.sku).toBe('OLEO-5W40-1L');
      expect(product.name).toBe('Óleo 5W40 sintético');
      expect(product.description).toBeNull();
      expect(product.productType).toBe(ProductType.PART);
      expect(product.unit).toBe(ProductUnit.UNIT);
      expect(product.cost).toBe(40);
      expect(product.salePrice).toBe(70);
    });

    it('should throw InvalidProductError when new sale price is negative', () => {
      const product = Product.create(validProps);

      expect(() => product.changeSalePrice(-10)).toThrow(InvalidProductError);
    });
  });

  describe('deactivate', () => {
    it('should mark the product as inactive', () => {
      const product = Product.create(validProps);
      const previousUpdatedAt = product.updatedAt;

      product.deactivate();

      expect(product.active).toBe(false);
      expect(product.updatedAt.getTime()).toBeGreaterThanOrEqual(
        previousUpdatedAt.getTime(),
      );
    });
  });
});
