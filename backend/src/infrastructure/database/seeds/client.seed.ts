import { DataSource } from 'typeorm';
import { ClientOrmEntity } from '../typeorm/entities/client.orm-entity';

const clients = [
  {
    name: 'Agnaldo Guimarães',
    documentType: 'CPF' as const,
    document: '11111111111',
    phone: '11999999999',
  },
];

export async function seedClients(dataSource: DataSource): Promise<void> {
  const repository = dataSource.getRepository(ClientOrmEntity);

  for (const client of clients) {
    const existingClient = await repository.findOneBy({
      document: client.document,
    });

    if (existingClient) {
      continue;
    }

    await repository.save(repository.create(client));
  }
}