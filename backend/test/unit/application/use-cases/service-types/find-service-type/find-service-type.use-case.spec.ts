import { FindServiceTypeUseCase } from '@/application/use-cases/service-types/find-service-type/find-service-type.use-case';
import { FakeServiceTypeRepository } from '../../../../../fakes/fake-service-type.repository';
import { ServiceTypeNotFoundError } from '@/domain/errors/service-type-not-found.error';
import { ServiceType } from '@/domain/entities/service-type.entity';

describe('FindServiceTypeUseCase', () => {
  let useCase: FindServiceTypeUseCase;
  let fakeRepository: FakeServiceTypeRepository;

  beforeEach(() => {
    fakeRepository = new FakeServiceTypeRepository();
    useCase = new FindServiceTypeUseCase(fakeRepository);
  });

  it('should return service type when it exists', async () => {
    const serviceType = ServiceType.create({
      description: 'Troca de óleo',
      unitValue: 120.0,
    });

    await fakeRepository.save(serviceType);

    const result = await useCase.execute({ id: serviceType.id });

    expect(result.id).toBe(serviceType.id);
    expect(result.description).toBe('Troca de óleo');
    expect(result.unitValue).toBe(120.0);
  });

  it('should throw ServiceTypeNotFoundError when service type does not exist', async () => {
    await expect(
      useCase.execute({ id: 'non-existent-id' }),
    ).rejects.toThrow(ServiceTypeNotFoundError);
  });
});
