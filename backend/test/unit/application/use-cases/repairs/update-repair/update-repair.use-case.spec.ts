import { UpdateRepairUseCase } from '@/application/use-cases/repairs/update-repair/update-repair.use-case';
import { FakeRepairRepository } from '../../../../../fakes/fake-repair.repository';
import { RepairNotFoundError } from '@/domain/errors/repair-not-found.error';
import { RepairAlreadyExistsError } from '@/domain/errors/repair-already-exists.error';
import { InvalidRepairError } from '@/domain/errors/invalid-repair.error';
import { Repair } from '@/domain/entities/repair.entity';
import { FakeDomainEventPublisher } from '../../../../../fakes/fake-domain-event-publisher';

describe('UpdateRepairUseCase', () => {
  let useCase: UpdateRepairUseCase;
  let fakeRepository: FakeRepairRepository;

  beforeEach(() => {
    fakeRepository = new FakeRepairRepository();
    useCase = new UpdateRepairUseCase(fakeRepository, new FakeDomainEventPublisher());
  });

  it('should update a repair with valid data', async () => {
    const repair = Repair.create({
      description: 'Troca de óleo',
      unitValue: 120.0,
    });

    await fakeRepository.save(repair);

    const result = await useCase.execute({
      id: repair.id,
      description: 'Troca de óleo sintético',
      unitValue: 150.0,
    });

    expect(result.description).toBe('Troca de óleo sintético');
    expect(result.unitValue).toBe(150.0);
  });

  it('should throw RepairNotFoundError when repair does not exist', async () => {
    await expect(
      useCase.execute({
        id: 'non-existent-id',
        description: 'Troca de óleo',
        unitValue: 120.0,
      }),
    ).rejects.toThrow(RepairNotFoundError);
  });

  it('should throw RepairAlreadyExistsError when description is already used by another repair', async () => {
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

    await expect(
      useCase.execute({
        id: repair2.id,
        description: 'Troca de óleo',
        unitValue: 180.0,
      }),
    ).rejects.toThrow(RepairAlreadyExistsError);
  });

  it('should allow updating to the same description', async () => {
    const repair = Repair.create({
      description: 'Troca de óleo',
      unitValue: 120.0,
    });

    await fakeRepository.save(repair);

    const result = await useCase.execute({
      id: repair.id,
      description: 'Troca de óleo',
      unitValue: 150.0,
    });

    expect(result.description).toBe('Troca de óleo');
    expect(result.unitValue).toBe(150.0);
  });

  it('should throw InvalidRepairError when description is invalid', async () => {
    const repair = Repair.create({
      description: 'Troca de óleo',
      unitValue: 120.0,
    });

    await fakeRepository.save(repair);

    await expect(
      useCase.execute({
        id: repair.id,
        description: '',
        unitValue: 120.0,
      }),
    ).rejects.toThrow(InvalidRepairError);
  });
});
