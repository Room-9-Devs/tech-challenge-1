import { Item, ItemType, ItemUnit } from '@/domain/entities/item.entity';
import { InvalidItemError } from '@/domain/errors/invalid-item.error';

describe('Item Entity', () => {
  const validProps = {
    sku: 'OLEO-5W30-1L',
    name: 'Óleo 5W30 sintético',
    description: 'Óleo lubrificante sintético',
    itemType: ItemType.CONSUMABLE,
    unit: ItemUnit.LITER,
    cost: 35.9,
    salePrice: 59.9,
  };

  describe('create', () => {
    it('should create an active item with valid data', () => {
      const item = Item.create(validProps);

      expect(item).toBeInstanceOf(Item);
      expect(item.id).toBeDefined();
      expect(item.sku).toBe('OLEO-5W30-1L');
      expect(item.name).toBe('Óleo 5W30 sintético');
      expect(item.description).toBe('Óleo lubrificante sintético');
      expect(item.itemType).toBe(ItemType.CONSUMABLE);
      expect(item.unit).toBe(ItemUnit.LITER);
      expect(item.cost).toBe(35.9);
      expect(item.salePrice).toBe(59.9);
      expect(item.active).toBe(true);
      expect(item.createdAt).toBeInstanceOf(Date);
      expect(item.updatedAt).toBeInstanceOf(Date);
    });

    it('should set description to null when it is not provided', () => {
      const item = Item.create({ ...validProps, description: undefined });

      expect(item.description).toBeNull();
    });

    it('should throw InvalidItemError when sku is empty', () => {
      expect(() => Item.create({ ...validProps, sku: '' })).toThrow(
        InvalidItemError,
      );
    });

    it('should throw InvalidItemError when sku is too long', () => {
      expect(() =>
        Item.create({ ...validProps, sku: 'A'.repeat(101) }),
      ).toThrow(InvalidItemError);
    });

    it('should throw InvalidItemError when name is too short', () => {
      expect(() => Item.create({ ...validProps, name: 'A' })).toThrow(
        InvalidItemError,
      );
    });

    it('should throw InvalidItemError when description is too long', () => {
      expect(() =>
        Item.create({ ...validProps, description: 'A'.repeat(256) }),
      ).toThrow(InvalidItemError);
    });

    it('should throw InvalidItemError when item type is invalid', () => {
      expect(() =>
        Item.create({ ...validProps, itemType: 'INVALID' as ItemType }),
      ).toThrow(InvalidItemError);
    });

    it('should throw InvalidItemError when unit is invalid', () => {
      expect(() =>
        Item.create({ ...validProps, unit: 'INVALID' as ItemUnit }),
      ).toThrow(InvalidItemError);
    });

    it('should throw InvalidItemError when cost is negative', () => {
      expect(() => Item.create({ ...validProps, cost: -1 })).toThrow(
        InvalidItemError,
      );
    });

    it('should throw InvalidItemError when sale price is not a number', () => {
      expect(() =>
        Item.create({ ...validProps, salePrice: Number('invalid') }),
      ).toThrow(InvalidItemError);
    });
  });

  describe('change methods', () => {
    it('should update item fields', () => {
      const item = Item.create(validProps);

      item.changeSku('OLEO-5W40-1L');
      item.changeName('Óleo 5W40 sintético');
      item.changeDescription(null);
      item.changeItemType(ItemType.PART);
      item.changeUnit(ItemUnit.UNIT);
      item.changeCost(40);
      item.changeSalePrice(70);

      expect(item.sku).toBe('OLEO-5W40-1L');
      expect(item.name).toBe('Óleo 5W40 sintético');
      expect(item.description).toBeNull();
      expect(item.itemType).toBe(ItemType.PART);
      expect(item.unit).toBe(ItemUnit.UNIT);
      expect(item.cost).toBe(40);
      expect(item.salePrice).toBe(70);
    });

    it('should throw InvalidItemError when new sale price is negative', () => {
      const item = Item.create(validProps);

      expect(() => item.changeSalePrice(-10)).toThrow(InvalidItemError);
    });
  });

  describe('deactivate', () => {
    it('should mark the item as inactive', () => {
      const item = Item.create(validProps);
      const previousUpdatedAt = item.updatedAt;

      item.deactivate();

      expect(item.active).toBe(false);
      expect(item.updatedAt.getTime()).toBeGreaterThanOrEqual(
        previousUpdatedAt.getTime(),
      );
    });
  });
});
