import { Inject, Injectable } from '@nestjs/common';
import { ROLE_REPOSITORY, RoleRecord, RoleRepository } from '@/application/ports/role.repository';

@Injectable()
export class ListRolesUseCase {
  constructor(@Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository) { }

  execute(): Promise<RoleRecord[]> {
    return this.roleRepository.findAll();
  }
}