import {
  MAX_STOCK_QUANTITY,
  StockMovement,
  StockMovementType,
} from '@/domain/entities/stock-movement.entity';
import { InvalidStockMovementError } from '@/domain/errors/invalid-stock-movement.error';

describe('StockMovement Entity', () => {
  const validProps = {
    productId: '550e8400-e29b-41d4-a716-446655440000',
    movementType: StockMovementType.IN,
    quantity: 10,
    previousQuantity: 5,
    createdBy: '660e8400-e29b-41d4-a716-446655440000',
  };

  describe('create', () => {
    it('should create a stock movement with valid data', () => {
      const stockMovement = StockMovement.create({
        ...validProps,
        description: 'Entrada de 10 litros de óleo 5W30',
        referenceType: 'WORK_ORDER',
        referenceId: '770e8400-e29b-41d4-a716-446655440000',
      });

      expect(stockMovement.id).toBeDefined();
      expect(stockMovement.productId).toBe(validProps.productId);
      expect(stockMovement.movementType).toBe(StockMovementType.IN);
      expect(stockMovement.quantity).toBe(10);
      expect(stockMovement.previousQuantity).toBe(5);
      expect(stockMovement.description).toBe(
        'Entrada de 10 litros de óleo 5W30',
      );
      expect(stockMovement.referenceType).toBe('WORK_ORDER');
      expect(stockMovement.referenceId).toBe(
        '770e8400-e29b-41d4-a716-446655440000',
      );
      expect(stockMovement.createdBy).toBe(validProps.createdBy);
      expect(stockMovement.createdAt).toBeInstanceOf(Date);
    });

    it('should default optional fields to null', () => {
      const stockMovement = StockMovement.create(validProps);

      expect(stockMovement.description).toBeNull();
      expect(stockMovement.referenceType).toBeNull();
      expect(stockMovement.referenceId).toBeNull();
    });

    it('should throw InvalidStockMovementError for invalid movement type', () => {
      expect(() =>
        StockMovement.create({
          ...validProps,
          movementType: 'TRANSFER' as StockMovementType,
        }),
      ).toThrow(InvalidStockMovementError);
    });

    it.each([StockMovementType.IN, StockMovementType.OUT])(
      'should throw InvalidStockMovementError for zero quantity on %s',
      (movementType) => {
        expect(() =>
          StockMovement.create({ ...validProps, movementType, quantity: 0 }),
        ).toThrow('A quantidade deve ser maior que 0');
      },
    );

    it.each([StockMovementType.IN, StockMovementType.OUT])(
      'should throw InvalidStockMovementError for negative quantity on %s',
      (movementType) => {
        expect(() =>
          StockMovement.create({ ...validProps, movementType, quantity: -5 }),
        ).toThrow(InvalidStockMovementError);
      },
    );

    it('should allow zero quantity on ADJUSTMENT', () => {
      const stockMovement = StockMovement.create({
        ...validProps,
        movementType: StockMovementType.ADJUSTMENT,
        quantity: 0,
      });

      expect(stockMovement.quantity).toBe(0);
    });

    it('should throw InvalidStockMovementError for negative quantity on ADJUSTMENT', () => {
      expect(() =>
        StockMovement.create({
          ...validProps,
          movementType: StockMovementType.ADJUSTMENT,
          quantity: -1,
        }),
      ).toThrow('A quantidade do ajuste deve ser maior ou igual a 0');
    });

    it('should throw InvalidStockMovementError for non integer quantity', () => {
      expect(() =>
        StockMovement.create({ ...validProps, quantity: 1.5 }),
      ).toThrow('A quantidade deve ser um número inteiro');
    });

    it('should throw InvalidStockMovementError for non numeric quantity', () => {
      expect(() =>
        StockMovement.create({
          ...validProps,
          quantity: '10' as unknown as number,
        }),
      ).toThrow('A quantidade deve ser um número inteiro');
    });

    it('should throw InvalidStockMovementError for missing quantity', () => {
      expect(() =>
        StockMovement.create({
          ...validProps,
          quantity: undefined as unknown as number,
        }),
      ).toThrow('A quantidade é obrigatória');
    });

    it('should throw InvalidStockMovementError for quantity above the integer column limit', () => {
      expect(() =>
        StockMovement.create({
          ...validProps,
          quantity: MAX_STOCK_QUANTITY + 1,
        }),
      ).toThrow(InvalidStockMovementError);
    });

    it.each([null, -1, 1.5])(
      'should throw InvalidStockMovementError for invalid previous quantity %p',
      (previousQuantity) => {
        expect(() =>
          StockMovement.create({ ...validProps, previousQuantity }),
        ).toThrow('A quantidade anterior do estoque');
      },
    );

    it('should throw InvalidStockMovementError for reference type longer than 50 characters', () => {
      expect(() =>
        StockMovement.create({ ...validProps, referenceType: 'A'.repeat(51) }),
      ).toThrow(InvalidStockMovementError);
    });

    it('should throw InvalidStockMovementError for missing product', () => {
      expect(() =>
        StockMovement.create({ ...validProps, productId: '' }),
      ).toThrow(InvalidStockMovementError);
    });

    it('should throw InvalidStockMovementError for missing creator', () => {
      expect(() =>
        StockMovement.create({ ...validProps, createdBy: '' }),
      ).toThrow(InvalidStockMovementError);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute a stock movement without validation', () => {
      const createdAt = new Date('2024-01-01');

      const stockMovement = StockMovement.reconstitute({
        id: 'movement-id',
        ...validProps,
        createdAt,
      });

      expect(stockMovement.id).toBe('movement-id');
      expect(stockMovement.createdAt).toBe(createdAt);
    });

    it('should reconstitute a legacy stock movement without previous quantity', () => {
      const stockMovement = StockMovement.reconstitute({
        ...validProps,
        previousQuantity: null,
      });

      expect(stockMovement.previousQuantity).toBeNull();
    });
  });
});
