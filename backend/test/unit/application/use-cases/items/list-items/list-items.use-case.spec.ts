import { ListItemsUseCase } from '@/application/use-cases/items/list-items/list-items.use-case';
import { FakeItemRepository } from '../../../../../fakes/fake-item.repository';
import { Item, ItemType, ItemUnit } from '@/domain/entities/item.entity';

describe('ListItemsUseCase', () => {
  let useCase: ListItemsUseCase;
  let fakeRepository: FakeItemRepository;

  const createItem = (sku: string, name: string): Item =>
    Item.create({
      sku,
      name,
      itemType: ItemType.PART,
      unit: ItemUnit.UNIT,
      cost: 100,
      salePrice: 150,
    });

  beforeEach(() => {
    fakeRepository = new FakeItemRepository();
    useCase = new ListItemsUseCase(fakeRepository);
  });

  it('should return list of items', async () => {
    await fakeRepository.save(createItem('PAST-FREIO-01', 'Pastilha de freio'));
    await fakeRepository.save(createItem('FILTRO-OLEO-01', 'Filtro de óleo'));

    const result = await useCase.execute();

    expect(result.items).toHaveLength(2);
    expect(result.items[0].sku).toBe('PAST-FREIO-01');
    expect(result.items[1].sku).toBe('FILTRO-OLEO-01');
  });

  it('should return empty list when no items exist', async () => {
    const result = await useCase.execute();

    expect(result.items).toEqual([]);
  });

  it('should not return inactive items', async () => {
    const activeItem = createItem('PAST-FREIO-01', 'Pastilha de freio');
    const inactiveItem = createItem('FILTRO-OLEO-01', 'Filtro de óleo');
    inactiveItem.deactivate();

    await fakeRepository.save(activeItem);
    await fakeRepository.save(inactiveItem);

    const result = await useCase.execute();

    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe(activeItem.id);
  });
});
