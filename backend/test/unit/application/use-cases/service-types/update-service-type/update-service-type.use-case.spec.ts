import { UpdateServiceTypeUseCase } from '@/application/use-cases/service-types/update-service-type/update-service-type.use-case';
import { FakeServiceTypeRepository } from '../../../../../fakes/fake-service-type.repository';
import { ServiceTypeNotFoundError } from '@/domain/errors/service-type-not-found.error';
import { ServiceTypeAlreadyExistsError } from '@/domain/errors/service-type-already-exists.error';
import { InvalidServiceTypeError } from '@/domain/errors/invalid-service-type.error';
import { ServiceType } from '@/domain/entities/service-type.entity';

describe('UpdateServiceTypeUseCase', () => {
  let useCase: UpdateServiceTypeUseCase;
  let fakeRepository: FakeServiceTypeRepository;

  beforeEach(() => {
    fakeRepository = new FakeServiceTypeRepository();
    useCase = new UpdateServiceTypeUseCase(fakeRepository);
  });

  it('should update a service type with valid data', async () => {
    const serviceType = ServiceType.create({
      description: 'Troca de óleo',
      unitValue: 120.0,
    });

    await fakeRepository.save(serviceType);

    const result = await useCase.execute({
      id: serviceType.id,
      description: 'Troca de óleo sintético',
      unitValue: 150.0,
    });

    expect(result.description).toBe('Troca de óleo sintético');
    expect(result.unitValue).toBe(150.0);
  });

  it('should throw ServiceTypeNotFoundError when service type does not exist', async () => {
    await expect(
      useCase.execute({
        id: 'non-existent-id',
        description: 'Troca de óleo',
        unitValue: 120.0,
      }),
    ).rejects.toThrow(ServiceTypeNotFoundError);
  });

  it('should throw ServiceTypeAlreadyExistsError when description is already used by another service type', async () => {
    const serviceType1 = ServiceType.create({
      description: 'Troca de óleo',
      unitValue: 120.0,
    });

    const serviceType2 = ServiceType.create({
      description: 'Alinhamento',
      unitValue: 180.0,
    });

    await fakeRepository.save(serviceType1);
    await fakeRepository.save(serviceType2);

    await expect(
      useCase.execute({
        id: serviceType2.id,
        description: 'Troca de óleo',
        unitValue: 180.0,
      }),
    ).rejects.toThrow(ServiceTypeAlreadyExistsError);
  });

  it('should allow updating to the same description', async () => {
    const serviceType = ServiceType.create({
      description: 'Troca de óleo',
      unitValue: 120.0,
    });

    await fakeRepository.save(serviceType);

    const result = await useCase.execute({
      id: serviceType.id,
      description: 'Troca de óleo',
      unitValue: 150.0,
    });

    expect(result.description).toBe('Troca de óleo');
    expect(result.unitValue).toBe(150.0);
  });

  it('should throw InvalidServiceTypeError when description is invalid', async () => {
    const serviceType = ServiceType.create({
      description: 'Troca de óleo',
      unitValue: 120.0,
    });

    await fakeRepository.save(serviceType);

    await expect(
      useCase.execute({
        id: serviceType.id,
        description: '',
        unitValue: 120.0,
      }),
    ).rejects.toThrow(InvalidServiceTypeError);
  });
});
