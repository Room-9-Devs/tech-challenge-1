import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    description: 'Identificador único do usuário',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Nome de usuário para login',
    example: 'jose.silveira',
  })
  username: string;

  @ApiProperty({
    description: 'Endereço de e-mail do usuário',
    example: 'jose.silveira@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Tipo da entidade associada ao usuário',
    example: 'client',
  })
  entityType: 'client' | 'employee';

  @ApiProperty({
    description: 'ID da entidade associada',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  entityId: string;

  @ApiProperty({
    description: 'Role do usuário',
    example: 'employee',
  })
  role: string;

  @ApiProperty({
    description: 'Perfil de funcionário ou cliente associado ao usuário',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'José Silveira',
      type: 'employee',
      documentType: 'CPF',
      document: '123.456.789-00',
      phone: '(20) 99999-9999',
      jobTitle: 'Mêcanico'
    }
  })
  profile: object;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
