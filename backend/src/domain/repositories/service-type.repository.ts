import { ServiceType } from '../entities/service-type.entity';

export interface ServiceTypeRepository {
  save(serviceType: ServiceType): Promise<ServiceType>;
  findById(id: string): Promise<ServiceType | null>;
  findAll(): Promise<ServiceType[]>;
  findByDescription(description: string): Promise<ServiceType | null>;
  delete(id: string): Promise<void>;
}
