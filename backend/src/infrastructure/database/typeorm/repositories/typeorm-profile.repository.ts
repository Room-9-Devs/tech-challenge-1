import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfileRepository, ClientProfileInput, EmployeeProfileInput, ProfileRecord } from '@/application/ports/profile.repository';
import { UserEntityType } from '@/domain/entities/user.entity';
import { ClientOrmEntity } from '../entities/client.orm-entity';
import { EmployeeOrmEntity } from '../entities/employee.orm-entity';

@Injectable()
export class TypeOrmProfileRepository implements ProfileRepository {
  constructor(
    @InjectRepository(ClientOrmEntity) private readonly clients: Repository<ClientOrmEntity>,
    @InjectRepository(EmployeeOrmEntity) private readonly employees: Repository<EmployeeOrmEntity>,
  ) { }

  async createClient(input: ClientProfileInput): Promise<ProfileRecord> {
    const client = await this.clients.save(this.clients.create(input));
    return { id: client.id, name: client.name, type: 'client', documentType: client.documentType, document: client.document, phone: client.phone };
  }

  async createEmployee(input: EmployeeProfileInput): Promise<ProfileRecord> {
    const employee = await this.employees.save(this.employees.create({
      name: input.name,
      documentType: input.documentType,
      document: input.document,
      jobTitle: input.jobTitle,
      phone: input.phone,
    }));
    return { id: employee.id, name: employee.name, type: 'employee', documentType: employee.documentType, document: employee.document, jobTitle: employee.jobTitle || undefined, phone: employee.phone };
  }

  async findById(type: UserEntityType, id: string): Promise<ProfileRecord | null> {
    if (type === 'client') {
      const client = await this.clients.findOneBy({ id });
      return client ? { id: client.id, name: client.name, type, documentType: client.documentType, document: client.document, phone: client.phone } : null;
    }
    const employee = await this.employees.findOneBy({ id });
    return employee ? { id: employee.id, name: employee.name, type, documentType: employee.documentType, document: employee.document, jobTitle: employee.jobTitle || undefined, phone: employee.phone } : null;
  }
}
