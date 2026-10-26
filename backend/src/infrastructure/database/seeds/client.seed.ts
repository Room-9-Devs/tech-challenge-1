import { DataSource } from 'typeorm';
import { ClientOrmEntity } from '../typeorm/entities/client.orm-entity';

const clients = [
  {
    name: 'Agnaldo Guimarães',
    documentType: 'CPF' as const,
    document: '45612378955',
    phone: '11999999999',
  },
];

export async function seedClients(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository(ClientOrmEntity);

  for (const client of clients) {
    const existingByDocument = await repository.findOneBy({
      document: client.document,
    });

    if (existingByDocument) {
      continue;
    }

    const existingByName = await repository.findOneBy({ name: client.name });

    if (existingByName) {
      await repository.update(existingByName.id, { ...client });
      continue;
    }

    await repository.save(repository.create(client));
  }
}