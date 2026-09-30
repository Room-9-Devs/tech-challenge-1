import { CreateItemUseCase } from '@/application/use-cases/items/create-item/create-item.use-case';
import { FakeItemRepository } from '../../../../../fakes/fake-item.repository';
import { ItemAlreadyExistsError } from '@/domain/errors/item-already-exists.error';
import { InvalidItemError } from '@/domain/errors/invalid-item.error';
import { Item, ItemType, ItemUnit } from '@/domain/entities/item.entity';

describe('CreateItemUseCase', () => {
  let useCase: CreateItemUseCase;
  let fakeRepository: FakeItemRepository;

  const input = {
    sku: 'OLEO-5W30-1L',
    name: 'Óleo 5W30 sintético',
    description: 'Óleo lubrificante sintético',
    itemType: ItemType.CONSUMABLE,
    unit: ItemUnit.LITER,
    cost: 35.9,
    salePrice: 59.9,
  };

  beforeEach(() => {
    fakeRepository = new FakeItemRepository();
    useCase = new CreateItemUseCase(fakeRepository);
  });

  it('should create an active item with valid data', async () => {
    const result = await useCase.execute(input);

    expect(result.id).toBeDefined();
    expect(result.sku).toBe('OLEO-5W30-1L');
    expect(result.name).toBe('Óleo 5W30 sintético');
    expect(result.itemType).toBe(ItemType.CONSUMABLE);
    expect(result.unit).toBe(ItemUnit.LITER);
    expect(result.cost).toBe(35.9);
    expect(result.salePrice).toBe(59.9);
    expect(result.active).toBe(true);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('should persist item through repository', async () => {
    const result = await useCase.execute(input);

    const persistedItem = await fakeRepository.findById(result.id);

    expect(persistedItem).not.toBeNull();
    expect(persistedItem!.sku).toBe('OLEO-5W30-1L');
  });

  it('should throw ItemAlreadyExistsError when sku already exists', async () => {
    await useCase.execute(input);

    await expect(
      useCase.execute({ ...input, name: 'Outro óleo' }),
    ).rejects.toThrow(ItemAlreadyExistsError);
  });

  it('should throw ItemAlreadyExistsError when sku belongs to an inactive item', async () => {
    const item = Item.create(input);
    item.deactivate();
    await fakeRepository.save(item);

    await expect(useCase.execute(input)).rejects.toThrow(
      ItemAlreadyExistsError,
    );
  });

  it('should throw InvalidItemError when name is invalid', async () => {
    await expect(useCase.execute({ ...input, name: '' })).rejects.toThrow(
      InvalidItemError,
    );
  });

  it('should throw InvalidItemError when cost is negative', async () => {
    await expect(useCase.execute({ ...input, cost: -10 })).rejects.toThrow(
      InvalidItemError,
    );
  });

  it('should propagate repository errors', async () => {
    jest
      .spyOn(fakeRepository, 'save')
      .mockRejectedValueOnce(new Error('Database error'));

    await expect(useCase.execute(input)).rejects.toThrow('Database error');
  });
});
