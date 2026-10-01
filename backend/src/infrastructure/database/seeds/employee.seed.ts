import { DataSource } from 'typeorm';
import { EmployeeOrmEntity } from '../typeorm/entities/employee.orm-entity';

const employees = [
  {
    name: 'José Silveira',
    documentType: 'CPF' as const,
    document: '22222222222',
    jobTitle: 'diretor',
    phone: '11999999991',
  },
  {
    name: 'Quitéria Dantas',
    documentType: 'CPF' as const,
    document: '33333333333',
    jobTitle: 'atendente',
    phone: '11999999992',
  },
  {
    name: 'Jeremias Lopes',
    documentType: 'CPF' as const,
    document: '44444444444',
    jobTitle: 'mecânico',
    phone: '11999999993',
  },
];

export async function seedEmployees(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository(EmployeeOrmEntity);

  for (const employee of employees) {
    const existingEmployee = await repository.findOneBy({
      name: employee.name,
      jobTitle: employee.jobTitle,
    });

    if (existingEmployee) {
      continue;
    }

    await repository.save(repository.create(employee));
  }
}