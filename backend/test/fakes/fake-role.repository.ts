import { RoleRecord, RoleRepository } from '@/application/ports/role.repository';

export class FakeRoleRepository implements RoleRepository {
  private readonly roles: RoleRecord[] = [
    { id: 'role-admin', name: 'Administrador', slug: 'admin' },
    { id: 'role-staff', name: 'Funcionário', slug: 'staff' },
    { id: 'role-client', name: 'Cliente', slug: 'client' },
  ];

  async findAll(): Promise<RoleRecord[]> { return [...this.roles]; }
  async findBySlug(slug: string): Promise<RoleRecord | null> { return this.roles.find((role) => role.slug === slug) || null; }
  async findById(id: string): Promise<RoleRecord | null> { return this.roles.find((role) => role.id === id) || null; }
}
