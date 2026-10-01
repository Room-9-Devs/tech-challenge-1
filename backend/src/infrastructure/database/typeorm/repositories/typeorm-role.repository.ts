import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoleRepository, RoleRecord } from '@/application/ports/role.repository';
import { RoleOrmEntity } from '../entities/role.orm-entity';

@Injectable()
export class TypeOrmRoleRepository implements RoleRepository {
  constructor(@InjectRepository(RoleOrmEntity) private readonly repository: Repository<RoleOrmEntity>) {}

  async findBySlug(slug: string): Promise<RoleRecord | null> {
    const role = await this.repository.findOneBy({ slug });
    return role ? { id: role.id, name: role.name, slug: role.slug } : null;
  }

  async findById(id: string): Promise<RoleRecord | null> {
    const role = await this.repository.findOneBy({ id });
    return role ? { id: role.id, name: role.name, slug: role.slug } : null;
  }
}
