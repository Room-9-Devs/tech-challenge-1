import { ApiProperty } from '@nestjs/swagger';
import { ApiLinksProperty } from '../hateoas/api-links-property.decorator';
import { Links } from '../hateoas/link.types';

export class VehicleResponseDto {
  @ApiProperty({
    description: 'Vehicle unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description:
      'Vehicle owner UUID; null only for legacy records awaiting backfill',
    type: String,
    nullable: true,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  user_id: string | null;

  @ApiProperty({
    description: 'Vehicle license plate',
    example: 'ABC1234',
  })
  license_plate: string;

  @ApiProperty({
    description: 'Vehicle model',
    example: 'Corolla',
  })
  model: string;

  @ApiProperty({
    description: 'Vehicle brand',
    example: 'Toyota',
  })
  brand: string;

  @ApiProperty({
    description: 'Vehicle manufacturing year',
    example: 2022,
  })
  year: number;

  @ApiProperty({
    description: 'Vehicle color',
    example: 'Black',
  })
  color: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2026-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
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
