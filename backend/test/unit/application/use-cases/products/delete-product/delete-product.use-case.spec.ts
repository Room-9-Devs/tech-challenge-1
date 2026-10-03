import { DeleteItemUseCase } from '@/application/use-cases/items/delete-item/delete-item.use-case';
import { FakeItemRepository } from '../../../../../fakes/fake-item.repository';
import { FakeStockRepository } from '../../../../../fakes/fake-stock.repository';
import { ItemNotFoundError } from '@/domain/errors/item-not-found.error';
import { ItemHasStockError } from '@/domain/errors/item-has-stock.error';
import { Item, ItemType, ItemUnit } from '@/domain/entities/item.entity';
import { Stock } from '@/domain/entities/stock.entity';

describe('DeleteItemUseCase', () => {
  let useCase: DeleteItemUseCase;
  let fakeItemRepository: FakeItemRepository;
  let fakeStockRepository: FakeStockRepository;
  let item: Item;

  beforeEach(async () => {
    fakeItemRepository = new FakeItemRepository();
    fakeStockRepository = new FakeStockRepository();
    useCase = new DeleteItemUseCase(fakeItemRepository, fakeStockRepository);

    item = Item.create({
      sku: 'PAST-FREIO-01',
      name: 'Pastilha de freio',
      itemType: ItemType.PART,
      unit: ItemUnit.UNIT,
      cost: 100,
      salePrice: 150,
    });

    await fakeItemRepository.save(item);
  });

  it('should deactivate an item without stock record', async () => {
    await useCase.execute({ id: item.id });

    const foundItem = await fakeItemRepository.findById(item.id);
    const persistedItem = await fakeItemRepository.findBySku(item.sku);

    expect(foundItem).toBeNull();
    expect(persistedItem).not.toBeNull();
    expect(persistedItem!.active).toBe(false);
  });

  it('should deactivate an item with empty stock', async () => {
    fakeStockRepository.add(
      Stock.reconstitute({ itemId: item.id, quantity: 0, reserved: 0 }),
    );

    await useCase.execute({ id: item.id });

    const persistedItem = await fakeItemRepository.findBySku(item.sku);
    expect(persistedItem!.active).toBe(false);
  });

  it('should throw ItemHasStockError when item has quantity in stock', async () => {
    fakeStockRepository.add(
      Stock.reconstitute({ itemId: item.id, quantity: 5, reserved: 0 }),
    );

    await expect(useCase.execute({ id: item.id })).rejects.toThrow(
      ItemHasStockError,
    );

    const persistedItem = await fakeItemRepository.findById(item.id);
    expect(persistedItem!.active).toBe(true);
  });

  it('should throw ItemHasStockError when item has reserved stock', async () => {
    fakeStockRepository.add(
      Stock.reconstitute({ itemId: item.id, quantity: 0, reserved: 2 }),
    );

    await expect(useCase.execute({ id: item.id })).rejects.toThrow(
      ItemHasStockError,
    );
  });

  it('should throw ItemNotFoundError when item does not exist', async () => {
    await expect(useCase.execute({ id: 'non-existent-id' })).rejects.toThrow(
      ItemNotFoundError,
    );
  });

  it('should throw ItemNotFoundError when item is already inactive', async () => {
    await useCase.execute({ id: item.id });

    await expect(useCase.execute({ id: item.id })).rejects.toThrow(
      ItemNotFoundError,
    );
  });
});
