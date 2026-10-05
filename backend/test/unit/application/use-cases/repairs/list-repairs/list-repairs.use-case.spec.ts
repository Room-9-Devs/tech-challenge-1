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

  it('should return list of repairs', async () => {
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

    expect(result.repairs).toHaveLength(2);
    expect(result.repairs[0].description).toBe('Troca de óleo');
    expect(result.repairs[1].description).toBe('Alinhamento');
  });

  it('should return empty list when no repairs exist', async () => {
    const result = await useCase.execute();

    expect(result.repairs).toEqual([]);
  });

  it('should not return soft-deleted repairs', async () => {
    const repair = Repair.create({
      description: 'Troca de óleo',
      unitValue: 120.0,
    });

    await fakeRepository.save(repair);
    await fakeRepository.delete(repair.id);

    const result = await useCase.execute();

    expect(result.repairs).toEqual([]);
  });
});
