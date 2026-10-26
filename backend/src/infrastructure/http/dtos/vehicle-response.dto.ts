import { ApiProperty } from '@nestjs/swagger';
import { ApiLinksProperty } from '../hateoas/api-links-property.decorator';
import { Links } from '../hateoas/link.types';

export class VehicleResponseDto {
  @ApiProperty({
    description: 'UUID do veículo',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description:
      'UUID do dono do veículo; nulo apenas em registros legados ainda sem dono vinculado',
    type: String,
    nullable: true,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  user_id: string | null;

  @ApiProperty({
    description: 'Placa do veículo, sem hífen e em maiúsculas',
    example: 'ABC1234',
  })
  license_plate: string;

  @ApiProperty({
    description: 'Modelo do veículo',
    example: 'Corolla',
  })
  model: string;

  @ApiProperty({
    description: 'Marca do veículo',
    example: 'Toyota',
  })
  brand: string;

  @ApiProperty({
    description: 'Ano de fabricação do veículo',
    example: 2022,
  })
  year: number;

  @ApiProperty({
    description: 'Cor do veículo',
    example: 'Preto',
  })
  color: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2026-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2026-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  @ApiLinksProperty({
    self: { href: '/vehicles/550e8400-e29b-41d4-a716-446655440000', method: 'GET' },
    update: { href: '/vehicles/550e8400-e29b-41d4-a716-446655440000', method: 'PUT' },
    delete: { href: '/vehicles/550e8400-e29b-41d4-a716-446655440000', method: 'DELETE' },
    owner: { href: '/users/550e8400-e29b-41d4-a716-446655440001', method: 'GET' },
    events: { href: '/events/vehicle/550e8400-e29b-41d4-a716-446655440000', method: 'GET' },
  })
  _links?: Links;
}
