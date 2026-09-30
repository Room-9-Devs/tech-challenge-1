import { ServiceType } from '@/domain/entities/service-type.entity';
import { ServiceTypeRepository } from '@/domain/repositories/service-type.repository';

interface StoredServiceType {
  serviceType: ServiceType;
  deletedAt: Date | null;
}

export class FakeServiceTypeRepository implements ServiceTypeRepository {
  private serviceTypes: StoredServiceType[] = [];

  async save(serviceType: ServiceType): Promise<ServiceType> {
    const existingIndex = this.serviceTypes.findIndex(
      (item) => item.serviceType.id === serviceType.id && !item.deletedAt,
    );

    if (existingIndex >= 0) {
      this.serviceTypes[existingIndex].serviceType = serviceType;
    } else {
      this.serviceTypes.push({ serviceType, deletedAt: null });
    }

    return serviceType;
  }

  async findById(id: string): Promise<ServiceType | null> {
    const item = this.serviceTypes.find(
      (item) => item.serviceType.id === id && !item.deletedAt,
    );
    return item ? item.serviceType : null;
  }

  async findAll(): Promise<ServiceType[]> {
    return this.serviceTypes
      .filter((item) => !item.deletedAt)
      .map((item) => item.serviceType);
  }

  async findByDescription(description: string): Promise<ServiceType | null> {
    const item = this.serviceTypes.find(
      (item) =>
        item.serviceType.description === description && !item.deletedAt,
    );
    return item ? item.serviceType : null;
  }

  async delete(id: string): Promise<void> {
    const item = this.serviceTypes.find(
      (item) => item.serviceType.id === id && !item.deletedAt,
    );

    if (item) {
      item.deletedAt = new Date();
    }
  }

  clear(): void {
    this.serviceTypes = [];
  }
}
