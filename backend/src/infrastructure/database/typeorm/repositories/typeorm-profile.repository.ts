import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import {
  ProfileRepository,
  ClientProfileInput,
  EmployeeProfileInput,
  ProfileRecord,
} from '@/application/ports/profile.repository';
import { UserEntityType } from '@/domain/entities/user.entity';
import { ClientOrmEntity } from '../entities/client.orm-entity';
import { EmployeeOrmEntity } from '../entities/employee.orm-entity';
import { DocumentAlreadyExistsError } from '@/domain/errors/document-already-exists.error';

@Injectable()
export class TypeOrmProfileRepository implements ProfileRepository {
  constructor(
    @InjectRepository(ClientOrmEntity)
    private readonly clients: Repository<ClientOrmEntity>,
    @InjectRepository(EmployeeOrmEntity)
    private readonly employees: Repository<EmployeeOrmEntity>,
  ) {}

  async createClient(input: ClientProfileInput): Promise<ProfileRecord> {
    try {
      const client = await this.clients.save(this.clients.create(input));
      return {
        id: client.id,
        name: client.name,
        type: 'client',
        documentType: client.documentType,
        document: client.document,
        phone: client.phone,
      };
    } catch (error) {
      this.rethrowPersistenceError(error);
    }
  }

  async createEmployee(input: EmployeeProfileInput): Promise<ProfileRecord> {
    try {
      const employee = await this.employees.save(
        this.employees.create({
          id: input.id,
          name: input.name,
          documentType: input.documentType,
          document: input.document,
          jobTitle: input.jobTitle,
          phone: input.phone,
        }),
      );
      return {
        id: employee.id,
        name: employee.name,
        type: 'employee',
        documentType: employee.documentType,
        document: employee.document,
        jobTitle: employee.jobTitle || undefined,
        phone: employee.phone,
      };
    } catch (error) {
      this.rethrowPersistenceError(error);
    }
  }

  private rethrowPersistenceError(error: unknown): never {
    if (
      error instanceof QueryFailedError &&
      error.driverError.code === '23505'
    ) {
      throw new DocumentAlreadyExistsError();
    }
    throw error;
  }

  async findById(
    type: UserEntityType,
    id: string,
  ): Promise<ProfileRecord | null> {
    if (type === 'client') {
      const client = await this.clients.findOneBy({ id });
      return client
        ? {
            id: client.id,
            name: client.name,
            type,
            documentType: client.documentType,
            document: client.document,
            phone: client.phone,
          }
        : null;
    }
    const employee = await this.employees.findOneBy({ id });
    return employee
      ? {
          id: employee.id,
          name: employee.name,
          type,
          documentType: employee.documentType,
          document: employee.document,
          jobTitle: employee.jobTitle || undefined,
          phone: employee.phone,
        }
      : null;
  }

  async update(
    type: UserEntityType,
    id: string,
    data: Partial<Pick<ProfileRecord, 'name' | 'phone' | 'jobTitle'>>,
  ): Promise<ProfileRecord | null> {
    if (type === 'client') {
      const client = await this.clients.findOneBy({ id });
      if (!client) return null;

      if (data.name !== undefined) client.name = data.name;
      if (data.phone !== undefined) client.phone = data.phone;

      await this.clients.save(client);
      return this.findById(type, id);
    }

    const employee = await this.employees.findOneBy({ id });
    if (!employee) return null;

    if (data.name !== undefined) employee.name = data.name;
    if (data.phone !== undefined) employee.phone = data.phone;
    if (data.jobTitle !== undefined) employee.jobTitle = data.jobTitle;

    await this.employees.save(employee);
    return this.findById(type, id);
  }
}
