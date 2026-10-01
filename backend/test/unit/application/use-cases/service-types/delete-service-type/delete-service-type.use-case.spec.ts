import { DeleteServiceTypeUseCase } from '@/application/use-cases/service-types/delete-service-type/delete-service-type.use-case';
import { FakeServiceTypeRepository } from '../../../../../fakes/fake-service-type.repository';
import { ServiceTypeNotFoundError } from '@/domain/errors/service-type-not-found.error';
import { ServiceType } from '@/domain/entities/service-type.entity';

describe('DeleteServiceTypeUseCase', () => {
  let useCase: DeleteServiceTypeUseCase;
  let fakeRepository: FakeServiceTypeRepository;

  beforeEach(() => {
    fakeRepository = new FakeServiceTypeRepository();
    useCase = new DeleteServiceTypeUseCase(fakeRepository);
  });

  it('should soft delete an existing service type', async () => {
    const serviceType = ServiceType.create({
      description: 'Troca de óleo',
      unitValue: 120.0,
    });

    await fakeRepository.save(serviceType);

    await useCase.execute({ id: serviceType.id });

    const foundServiceType = await fakeRepository.findById(serviceType.id);
    expect(foundServiceType).toBeNull();
  });

  it('should throw ServiceTypeNotFoundError when service type does not exist', async () => {
    await expect(
      useCase.execute({ id: 'non-existent-id' }),
    ).rejects.toThrow(ServiceTypeNotFoundError);
  });
});
