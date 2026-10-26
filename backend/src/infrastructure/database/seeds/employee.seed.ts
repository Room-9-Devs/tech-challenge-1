import { DataSource } from 'typeorm';
import { EmployeeOrmEntity } from '../typeorm/entities/employee.orm-entity';

const employees = [
  {
    name: 'José Silveira',
    documentType: 'CPF' as const,
    document: '83247195637',
    jobTitle: 'diretor',
    phone: '11999999991',
  },
  {
    name: 'Quitéria Dantas',
    documentType: 'CPF' as const,
    document: '19045876230',
    jobTitle: 'atendente',
    phone: '11999999992',
  },
  {
    name: 'Jeremias Lopes',
    documentType: 'CPF' as const,
    document: '67590421820',
    jobTitle: 'mecânico',
    phone: '11999999993',
  },
];

export async function seedEmployees(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository(EmployeeOrmEntity);

  for (const employee of employees) {
    const existingByDocument = await repository.findOneBy({
      document: employee.document,
    });

    if (existingByDocument) {
      continue;
    }

    const existingByName = await repository.findOneBy({
      name: employee.name,
      jobTitle: employee.jobTitle,
    });

    if (existingByName) {
      await repository.update(existingByName.id, { ...employee });
      continue;
    }

    await repository.save(repository.create(employee));
  }
}