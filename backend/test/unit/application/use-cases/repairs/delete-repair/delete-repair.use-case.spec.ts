import { DeleteRepairUseCase } from '@/application/use-cases/repairs/delete-repair/delete-repair.use-case';
import { FakeRepairRepository } from '../../../../../fakes/fake-repair.repository';
import { RepairNotFoundError } from '@/domain/errors/repair-not-found.error';
import { Repair } from '@/domain/entities/repair.entity';

describe('DeleteRepairUseCase', () => {
  let useCase: DeleteRepairUseCase;
  let fakeRepository: FakeRepairRepository;

  beforeEach(() => {
    fakeRepository = new FakeRepairRepository();
    useCase = new DeleteRepairUseCase(fakeRepository);
  });

  it('should soft delete an existing repair', async () => {
    const repair = Repair.create({
      description: 'Troca de óleo',
      unitValue: 120.0,
    });

    await fakeRepository.save(repair);

    await useCase.execute({ id: repair.id });

    const foundRepair = await fakeRepository.findById(repair.id);
    expect(foundRepair).toBeNull();
  });

  it('should throw RepairNotFoundError when repair does not exist', async () => {
    await expect(
      useCase.execute({ id: 'non-existent-id' }),
    ).rejects.toThrow(RepairNotFoundError);
  });
});
