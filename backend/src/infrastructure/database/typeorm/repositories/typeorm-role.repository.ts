import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleRepository, RoleRecord } from '@/application/ports/role.repository';
import { RoleOrmEntity } from '../entities/role.orm-entity';

@Injectable()
export class TypeOrmRoleRepository implements RoleRepository {
  constructor(@InjectRepository(RoleOrmEntity) private readonly repository: Repository<RoleOrmEntity>) { }

  async findAll(): Promise<RoleRecord[]> {
    const roles = await this.repository.find({ order: { name: 'ASC' } });
    return roles.map((role) => this.toRecord(role));
  }

  async findBySlug(slug: string): Promise<RoleRecord | null> {
    const role = await this.repository.findOneBy({ slug });
    return role ? this.toRecord(role) : null;
  }

  async findById(id: string): Promise<RoleRecord | null> {
    const role = await this.repository.findOneBy({ id });
    return role ? this.toRecord(role) : null;
  }

  private toRecord(role: RoleOrmEntity): RoleRecord {
    return { id: role.id, name: role.name, slug: role.slug };
  }
}
