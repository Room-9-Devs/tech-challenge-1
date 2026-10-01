import { CreateServiceTypeUseCase } from '@/application/use-cases/service-types/create-service-type/create-service-type.use-case';
import { FakeServiceTypeRepository } from '../../../../../fakes/fake-service-type.repository';
import { ServiceTypeAlreadyExistsError } from '@/domain/errors/service-type-already-exists.error';
import { InvalidServiceTypeError } from '@/domain/errors/invalid-service-type.error';

describe('CreateServiceTypeUseCase', () => {
  let useCase: CreateServiceTypeUseCase;
  let fakeRepository: FakeServiceTypeRepository;

  beforeEach(() => {
    fakeRepository = new FakeServiceTypeRepository();
    useCase = new CreateServiceTypeUseCase(fakeRepository);
  });

  it('should create a service type with valid data', async () => {
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

  it('should throw ServiceTypeAlreadyExistsError when description already exists', async () => {
    await useCase.execute({
      description: 'Troca de óleo',
      unitValue: 120.0,
    });

    await expect(
      useCase.execute({
        description: 'Troca de óleo',
        unitValue: 150.0,
      }),
    ).rejects.toThrow(ServiceTypeAlreadyExistsError);
  });

  it('should throw InvalidServiceTypeError when description is invalid', async () => {
    await expect(
      useCase.execute({
        description: '',
        unitValue: 120.0,
      }),
    ).rejects.toThrow(InvalidServiceTypeError);
  });

  it('should throw InvalidServiceTypeError when unit value is negative', async () => {
    await expect(
      useCase.execute({
        description: 'Troca de óleo',
        unitValue: -10,
      }),
    ).rejects.toThrow(InvalidServiceTypeError);
  });

  it('should persist service type through repository', async () => {
    const result = await useCase.execute({
      description: 'Troca de óleo',
      unitValue: 120.0,
    });

    const persistedServiceType = await fakeRepository.findById(result.id);

    expect(persistedServiceType).not.toBeNull();
    expect(persistedServiceType!.description).toBe('Troca de óleo');
    expect(persistedServiceType!.unitValue).toBe(120.0);
  });
});
