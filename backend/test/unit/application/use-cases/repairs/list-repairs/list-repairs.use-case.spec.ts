import { ListRepairsUseCase } from '@/application/use-cases/repairs/list-repairs/list-repairs.use-case';
import { FakeRepairRepository } from '../../../../../fakes/fake-repair.repository';
import { Repair } from '@/domain/entities/repair.entity';

describe('ListRepairsUseCase', () => {
  let useCase: ListRepairsUseCase;
  let fakeRepository: FakeRepairRepository;

  beforeEach(() => {
    fakeRepository = new FakeRepairRepository();
    useCase = new ListRepairsUseCase(fakeRepository);
  });

  it('should return paginated list of repairs', async () => {
    const repair1 = Repair.create({
      description: 'Troca de óleo',
      unitValue: 120.0,
    });

    const repair2 = Repair.create({
      description: 'Alinhamento',
      unitValue: 180.0,
    });

    await fakeRepository.save(repair1);
    await fakeRepository.save(repair2);

    const result = await useCase.execute();

    expect(result.data).toHaveLength(2);
    expect(result.meta.page).toBe(1);
    expect(result.meta.limit).toBe(10);
    expect(result.meta.totalItems).toBe(2);
    expect(result.meta.totalPages).toBe(1);
    expect(result.data[0].description).toBe('Troca de óleo');
    expect(result.data[1].description).toBe('Alinhamento');
  });

  it('should return empty paginated list when no repairs exist', async () => {
    const result = await useCase.execute();

    expect(result.data).toEqual([]);
    expect(result.meta.totalItems).toBe(0);
    expect(result.meta.totalPages).toBe(1);
  });

  it('should not return soft-deleted repairs', async () => {
    const repair = Repair.create({
      description: 'Troca de óleo',
      unitValue: 120.0,
    });

    await fakeRepository.save(repair);
    await fakeRepository.delete(repair.id);

    const result = await useCase.execute();

    expect(result.data).toEqual([]);
  });

  it('should paginate results', async () => {
    await fakeRepository.save(Repair.create({ description: 'Service A', unitValue: 100 }));
    await fakeRepository.save(Repair.create({ description: 'Service B', unitValue: 100 }));
    await fakeRepository.save(Repair.create({ description: 'Service C', unitValue: 100 }));

    const result = await useCase.execute({ page: 2, limit: 2 });

    expect(result.data).toHaveLength(1);
    expect(result.meta.page).toBe(2);
    expect(result.meta.limit).toBe(2);
    expect(result.meta.totalItems).toBe(3);
    expect(result.meta.totalPages).toBe(2);
  });

  it('should search repairs by description', async () => {
    await fakeRepository.save(Repair.create({ description: 'Troca de óleo', unitValue: 100 }));
    await fakeRepository.save(Repair.create({ description: 'Alinhamento', unitValue: 100 }));

    const result = await useCase.execute({ search: 'óleo' });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].description).toBe('Troca de óleo');
  });

  it('should filter repairs dynamically by field', async () => {
    await fakeRepository.save(Repair.create({ description: 'Service A', unitValue: 50 }));
    await fakeRepository.save(Repair.create({ description: 'Service B', unitValue: 150 }));
    await fakeRepository.save(Repair.create({ description: 'Service C', unitValue: 250 }));

    const result = await useCase.execute({
      filters: { unitValue: 150 },
    });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].description).toBe('Service B');
  });
});
