import { ListServiceTypesUseCase } from '@/application/use-cases/service-types/list-service-types/list-service-types.use-case';
import { FakeServiceTypeRepository } from '../../../../../fakes/fake-service-type.repository';
import { ServiceType } from '@/domain/entities/service-type.entity';

describe('ListServiceTypesUseCase', () => {
  let useCase: ListServiceTypesUseCase;
  let fakeRepository: FakeServiceTypeRepository;

  beforeEach(() => {
    fakeRepository = new FakeServiceTypeRepository();
    useCase = new ListServiceTypesUseCase(fakeRepository);
  });

  it('should return list of service types', async () => {
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

    const result = await useCase.execute();

    expect(result.serviceTypes).toHaveLength(2);
    expect(result.serviceTypes[0].description).toBe('Troca de óleo');
    expect(result.serviceTypes[1].description).toBe('Alinhamento');
  });

  it('should return empty list when no service types exist', async () => {
    const result = await useCase.execute();

    expect(result.serviceTypes).toEqual([]);
  });

  it('should not return soft-deleted service types', async () => {
    const serviceType = ServiceType.create({
      description: 'Troca de óleo',
      unitValue: 120.0,
    });

    await fakeRepository.save(serviceType);
    await fakeRepository.delete(serviceType.id);

    const result = await useCase.execute();

    expect(result.serviceTypes).toEqual([]);
  });
});
