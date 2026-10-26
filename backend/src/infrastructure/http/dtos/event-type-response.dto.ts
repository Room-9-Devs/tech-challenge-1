import { ApiProperty } from '@nestjs/swagger';
import { ApiLinksProperty } from '../hateoas/api-links-property.decorator';
import { Links } from '../hateoas/link.types';

export class EventTypeResponseDto {
  @ApiProperty({ description: 'ID do tipo de evento.', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'Código único do tipo de evento.' })
  code: string;

  @ApiProperty({ description: 'Nome legível do tipo de evento.' })
  name: string;

  @ApiProperty({ description: 'Descrição do tipo de evento.', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Entidades permitidas para esse evento.', type: [String] })
  allowedEntityTypes: string[];

  @ApiProperty({ description: 'Data de criação.' })
  createdAt: Date;

  @ApiLinksProperty({
    self: { href: '/event-types/550e8400-e29b-41d4-a716-446655440000', method: 'GET' },
    update: { href: '/event-types/550e8400-e29b-41d4-a716-446655440000', method: 'PUT' },
  })
  _links?: Links;
}
