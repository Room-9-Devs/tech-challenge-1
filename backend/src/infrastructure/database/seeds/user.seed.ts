import { randomBytes, scryptSync } from 'crypto';
import { DataSource } from 'typeorm';
import { ClientOrmEntity } from '../typeorm/entities/client.orm-entity';
import { EmployeeOrmEntity } from '../typeorm/entities/employee.orm-entity';
import { RoleOrmEntity } from '../typeorm/entities/role.orm-entity';
import { UserOrmEntity } from '../typeorm/entities/user.orm-entity';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');

  return `scrypt$${salt}$${hash}`;
}

export async function seedUsers(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(UserOrmEntity);
  const roleRepository = dataSource.getRepository(RoleOrmEntity);
  const clientRepository = dataSource.getRepository(ClientOrmEntity);
  const employeeRepository = dataSource.getRepository(EmployeeOrmEntity);

  const [adminRole, staffRole, clientRole] = await Promise.all([
    roleRepository.findOneByOrFail({ slug: 'admin' }),
    roleRepository.findOneByOrFail({ slug: 'staff' }),
    roleRepository.findOneByOrFail({ slug: 'client' }),
  ]);

  const [jose, quiteria, jeremias] = await Promise.all([
    employeeRepository.findOneByOrFail({ name: 'José Silveira' }),
    employeeRepository.findOneByOrFail({ name: 'Quitéria Dantas' }),
    employeeRepository.findOneByOrFail({ name: 'Jeremias Lopes' }),
  ]);
  const agnaldo = await clientRepository.findOneByOrFail({
    document: '11111111111',
  });

  const users = [
    {
      username: 'jose.silveira',
      email: 'jose.silveira@example.com',
      password: 'password123',
      entityType: 'employee' as const,
      entityId: jose.id,
      roleId: adminRole.id,
    },
    {
      username: 'quiteria.dantas',
      email: 'quiteria.dantas@example.com',
      password: 'password123',
      entityType: 'employee' as const,
      entityId: quiteria.id,
      roleId: staffRole.id,
    },
    {
      username: 'jeremias.lopes',
      email: 'jeremias.lopes@example.com',
      password: 'password123',
      entityType: 'employee' as const,
      entityId: jeremias.id,
      roleId: staffRole.id,
    },
    {
      username: 'agnaldo.guimaraes',
      email: 'agnaldo.guimaraes@example.com',
      password: 'password123',
      entityType: 'client' as const,
      entityId: agnaldo.id,
      roleId: clientRole.id,
    },
  ];

  for (const user of users) {
    const existingUser = await userRepository.findOneBy({
      username: user.username,
    });

    if (existingUser) {
      continue;
    }

    await userRepository.save(
      userRepository.create({
        ...user,
        password: hashPassword(user.password),
      }),
    );
  }
}