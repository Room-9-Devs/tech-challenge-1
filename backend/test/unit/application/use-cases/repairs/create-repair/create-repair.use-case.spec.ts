import { CreateRepairUseCase } from '@/application/use-cases/repairs/create-repair/create-repair.use-case';
import { FakeRepairRepository } from '../../../../../fakes/fake-repair.repository';
import { RepairAlreadyExistsError } from '@/domain/errors/repair-already-exists.error';
import { InvalidRepairError } from '@/domain/errors/invalid-repair.error';
import { FakeDomainEventPublisher } from '../../../../../fakes/fake-domain-event-publisher';

describe('CreateRepairUseCase', () => {
  let useCase: CreateRepairUseCase;
  let fakeRepository: FakeRepairRepository;

  beforeEach(() => {
    fakeRepository = new FakeRepairRepository();
    useCase = new CreateRepairUseCase(fakeRepository, new FakeDomainEventPublisher());
  });

  it('should create a repair with valid data', async () => {
    const result = await useCase.execute({
      description: 'Troca de óleo',
      unitValue: 120.0,
    });

    expect(result.id).toBeDefined();
    expect(result.description).toBe('Troca de óleo');
    expect(result.unitValue).toBe(120.0);
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.updatedAt).toBeInstanceOf(Date);
  });

  it('should throw RepairAlreadyExistsError when description already exists', async () => {
    await useCase.execute({
      description: 'Troca de óleo',
      unitValue: 120.0,
    });

    await expect(
      useCase.execute({
        description: 'Troca de óleo',
        unitValue: 150.0,
      }),
    ).rejects.toThrow(RepairAlreadyExistsError);
  });

  it('should throw InvalidRepairError when description is invalid', async () => {
    await expect(
      useCase.execute({
        description: '',
        unitValue: 120.0,
      }),
    ).rejects.toThrow(InvalidRepairError);
  });

  it('should throw InvalidRepairError when unit value is negative', async () => {
    await expect(
      useCase.execute({
        description: 'Troca de óleo',
        unitValue: -10,
      }),
    ).rejects.toThrow(InvalidRepairError);
  });

  it('should persist repair through repository', async () => {
    const result = await useCase.execute({
      description: 'Troca de óleo',
      unitValue: 120.0,
    });

    const persistedRepair = await fakeRepository.findById(result.id);

    expect(persistedRepair).not.toBeNull();
    expect(persistedRepair!.description).toBe('Troca de óleo');
    expect(persistedRepair!.unitValue).toBe(120.0);
  });
});
