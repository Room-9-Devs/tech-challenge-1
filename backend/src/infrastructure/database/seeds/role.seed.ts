import { DataSource } from 'typeorm';
import { RoleOrmEntity } from '../typeorm/entities/role.orm-entity';

const roles = [
  { name: 'Administrador', slug: 'admin' },
  { name: 'Equipe', slug: 'staff' },
  { name: 'Cliente', slug: 'client' },
];

export async function seedRoles(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository(RoleOrmEntity);

  for (const role of roles) {
    const existingRole = await repository.findOneBy({ slug: role.slug });

    if (existingRole) {
      continue;
    }

    await repository.save(repository.create(role));
  }
}