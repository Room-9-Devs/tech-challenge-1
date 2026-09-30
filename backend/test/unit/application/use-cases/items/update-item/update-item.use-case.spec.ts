import { UpdateItemUseCase } from '@/application/use-cases/items/update-item/update-item.use-case';
import { FakeItemRepository } from '../../../../../fakes/fake-item.repository';
import { ItemNotFoundError } from '@/domain/errors/item-not-found.error';
import { ItemAlreadyExistsError } from '@/domain/errors/item-already-exists.error';
import { InvalidItemError } from '@/domain/errors/invalid-item.error';
import { Item, ItemType, ItemUnit } from '@/domain/entities/item.entity';

describe('UpdateItemUseCase', () => {
  let useCase: UpdateItemUseCase;
  let fakeRepository: FakeItemRepository;

  const createItem = (sku: string): Item =>
    Item.create({
      sku,
      name: 'Pastilha de freio',
      itemType: ItemType.PART,
      unit: ItemUnit.UNIT,
      cost: 100,
      salePrice: 150,
    });

  const updateData = {
    sku: 'PAST-FREIO-02',
    name: 'Pastilha de freio cerâmica',
    description: 'Pastilha de freio dianteira',
    itemType: ItemType.PART,
    unit: ItemUnit.UNIT,
    cost: 120,
    salePrice: 190,
  };

  beforeEach(() => {
    fakeRepository = new FakeItemRepository();
    useCase = new UpdateItemUseCase(fakeRepository);
  });

  it('should update an item with valid data', async () => {
    const item = createItem('PAST-FREIO-01');
    await fakeRepository.save(item);

    const result = await useCase.execute({ id: item.id, ...updateData });

    expect(result.id).toBe(item.id);
    expect(result.sku).toBe('PAST-FREIO-02');
    expect(result.name).toBe('Pastilha de freio cerâmica');
    expect(result.description).toBe('Pastilha de freio dianteira');
    expect(result.cost).toBe(120);
    expect(result.salePrice).toBe(190);
    expect(result.active).toBe(true);
  });

  it('should allow updating with the same sku', async () => {
    const item = createItem('PAST-FREIO-01');
    await fakeRepository.save(item);

    const result = await useCase.execute({
      id: item.id,
      ...updateData,
      sku: 'PAST-FREIO-01',
    });

    expect(result.sku).toBe('PAST-FREIO-01');
    expect(result.salePrice).toBe(190);
  });

  it('should throw ItemNotFoundError when item does not exist', async () => {
    await expect(
      useCase.execute({ id: 'non-existent-id', ...updateData }),
    ).rejects.toThrow(ItemNotFoundError);
  });

  it('should throw ItemNotFoundError when item is inactive', async () => {
    const item = createItem('PAST-FREIO-01');
    item.deactivate();
    await fakeRepository.save(item);

    await expect(
      useCase.execute({ id: item.id, ...updateData }),
    ).rejects.toThrow(ItemNotFoundError);
  });

  it('should throw ItemAlreadyExistsError when sku is already used by another item', async () => {
    const item1 = createItem('PAST-FREIO-01');
    const item2 = createItem('PAST-FREIO-02');
    await fakeRepository.save(item1);
    await fakeRepository.save(item2);

    await expect(
      useCase.execute({ id: item1.id, ...updateData, sku: 'PAST-FREIO-02' }),
    ).rejects.toThrow(ItemAlreadyExistsError);
  });

  it('should throw InvalidItemError when data is invalid', async () => {
    const item = createItem('PAST-FREIO-01');
    await fakeRepository.save(item);

    await expect(
      useCase.execute({ id: item.id, ...updateData, salePrice: -1 }),
    ).rejects.toThrow(InvalidItemError);
  });
});
