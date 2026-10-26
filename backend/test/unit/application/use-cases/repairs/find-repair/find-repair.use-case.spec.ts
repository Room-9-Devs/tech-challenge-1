import { FindRepairUseCase } from '@/application/use-cases/repairs/find-repair/find-repair.use-case';
import { FakeRepairRepository } from '../../../../../fakes/fake-repair.repository';
import { RepairNotFoundError } from '@/domain/errors/repair-not-found.error';
import { Repair } from '@/domain/entities/repair.entity';

describe('FindRepairUseCase', () => {
  let useCase: FindRepairUseCase;
  let fakeRepository: FakeRepairRepository;

  beforeEach(() => {
    fakeRepository = new FakeRepairRepository();
    useCase = new FindRepairUseCase(fakeRepository);
  });

  it('should return repair when it exists', async () => {
    const repair = Repair.create({
      description: 'Troca de óleo',
      unitValue: 120.0,
    });

    await fakeRepository.save(repair);

    const result = await useCase.execute({ id: repair.id });

    expect(result.id).toBe(repair.id);
    expect(result.description).toBe('Troca de óleo');
    expect(result.unitValue).toBe(120.0);
  });

  it('should throw RepairNotFoundError when repair does not exist', async () => {
    await expect(
      useCase.execute({ id: 'non-existent-id' }),
    ).rejects.toThrow(RepairNotFoundError);
  });
});
