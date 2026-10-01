export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');

export interface RoleRecord {
  id: string;
  name: string;
  slug: string;
}

export interface RoleRepository {
  findAll(): Promise<RoleRecord[]>;
  findBySlug(slug: string): Promise<RoleRecord | null>;
  findById(id: string): Promise<RoleRecord | null>;
}
