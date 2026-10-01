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

  entityType: 'client' | 'employee';
  entityId: string;
  role: string;
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
