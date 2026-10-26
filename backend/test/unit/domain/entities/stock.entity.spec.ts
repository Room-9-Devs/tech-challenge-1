import { Stock } from '@/domain/entities/stock.entity';
import {
  MAX_STOCK_QUANTITY,
  StockMovement,
  StockMovementType,
} from '@/domain/entities/stock-movement.entity';
import { InsufficientStockError } from '@/domain/errors/insufficient-stock.error';
import { InvalidStockMovementError } from '@/domain/errors/invalid-stock-movement.error';
import { StockBelowReservedError } from '@/domain/errors/stock-below-reserved.error';

describe('Stock Entity', () => {
  const productId = '550e8400-e29b-41d4-a716-446655440000';

  const createMovement = (
    movementType: StockMovementType,
    quantity: number,
    movementProductId = productId,
  ): StockMovement =>
    StockMovement.create({
      productId: movementProductId,
      movementType,
      quantity,
      previousQuantity: 0,
      createdBy: '660e8400-e29b-41d4-a716-446655440000',
    });

  const createStock = (quantity: number, reserved = 0): Stock =>
    Stock.reconstitute({ productId, quantity, reserved });

  describe('create', () => {
    it('should create an empty stock for the product', () => {
      const stock = Stock.create({ productId });

      expect(stock.id).toBeDefined();
      expect(stock.productId).toBe(productId);
      expect(stock.quantity).toBe(0);
      expect(stock.reserved).toBe(0);
      expect(stock.hasBalance()).toBe(false);
    });
  });

  describe('available', () => {
    it('should be the quantity not reserved', () => {
      expect(createStock(10, 5).available).toBe(5);
      expect(createStock(10, 0).available).toBe(10);
    });
  });

  describe('applyMovement', () => {
    it('should add the quantity on IN', () => {
      const stock = createStock(10);

      stock.applyMovement(createMovement(StockMovementType.IN, 5));

      expect(stock.quantity).toBe(15);
    });

    it('should subtract the quantity on OUT', () => {
      const stock = createStock(10);

      stock.applyMovement(createMovement(StockMovementType.OUT, 4));

      expect(stock.quantity).toBe(6);
    });

    it('should allow OUT of the whole quantity', () => {
      const stock = createStock(10);

      stock.applyMovement(createMovement(StockMovementType.OUT, 10));

      expect(stock.quantity).toBe(0);
    });

    it('should throw InsufficientStockError when OUT is greater than the quantity', () => {
      const stock = createStock(10);

      expect(() =>
        stock.applyMovement(createMovement(StockMovementType.OUT, 15)),
      ).toThrow(InsufficientStockError);
      expect(stock.quantity).toBe(10);
    });

    it('should set the quantity on ADJUSTMENT', () => {
      const stock = createStock(10);

      stock.applyMovement(createMovement(StockMovementType.ADJUSTMENT, 7));

      expect(stock.quantity).toBe(7);
    });

    it('should allow ADJUSTMENT to zero', () => {
      const stock = createStock(10);

      stock.applyMovement(createMovement(StockMovementType.ADJUSTMENT, 0));

      expect(stock.quantity).toBe(0);
    });

    it('should not change reserved quantity', () => {
      const stock = createStock(10, 3);

      stock.applyMovement(createMovement(StockMovementType.OUT, 4));

      expect(stock.reserved).toBe(3);
    });

    it('should allow OUT up to the available quantity', () => {
      const stock = createStock(10, 5);

      stock.applyMovement(createMovement(StockMovementType.OUT, 5));

      expect(stock.quantity).toBe(5);
      expect(stock.available).toBe(0);
    });

    it('should throw InsufficientStockError when OUT would consume reserved quantity', () => {
      const stock = createStock(10, 5);

      expect(() =>
        stock.applyMovement(createMovement(StockMovementType.OUT, 6)),
      ).toThrow(InsufficientStockError);
      expect(stock.quantity).toBe(10);
    });

    it('should allow ADJUSTMENT down to the reserved quantity', () => {
      const stock = createStock(10, 5);

      stock.applyMovement(createMovement(StockMovementType.ADJUSTMENT, 5));

      expect(stock.quantity).toBe(5);
      expect(stock.available).toBe(0);
    });

    it('should throw StockBelowReservedError when ADJUSTMENT is below the reserved quantity', () => {
      const stock = createStock(10, 5);

      expect(() =>
        stock.applyMovement(createMovement(StockMovementType.ADJUSTMENT, 4)),
      ).toThrow(StockBelowReservedError);
      expect(stock.quantity).toBe(10);
    });

    it('should update updatedAt', () => {
      const stock = Stock.reconstitute({
        productId,
        quantity: 10,
        reserved: 0,
        updatedAt: new Date('2024-01-01'),
      });

      stock.applyMovement(createMovement(StockMovementType.IN, 1));

      expect(stock.updatedAt.getTime()).toBeGreaterThan(
        new Date('2024-01-01').getTime(),
      );
    });

    it('should throw InvalidStockMovementError when IN exceeds the integer column limit', () => {
      const stock = createStock(MAX_STOCK_QUANTITY);

      expect(() =>
        stock.applyMovement(createMovement(StockMovementType.IN, 1)),
      ).toThrow(InvalidStockMovementError);
      expect(stock.quantity).toBe(MAX_STOCK_QUANTITY);
    });

    it('should throw InvalidStockMovementError when the movement belongs to another product', () => {
      const stock = createStock(10);

      expect(() =>
        stock.applyMovement(
          createMovement(
            StockMovementType.IN,
            1,
            '770e8400-e29b-41d4-a716-446655440000',
          ),
        ),
      ).toThrow(InvalidStockMovementError);
      expect(stock.quantity).toBe(10);
    });
  });
});
