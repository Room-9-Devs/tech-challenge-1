import { ApiProperty } from '@nestjs/swagger';
import { ApiLinksProperty } from '../hateoas/api-links-property.decorator';
import { Links } from '../hateoas/link.types';

export class EventResponseDto {
  @ApiProperty({ description: 'ID do evento.', format: 'uuid' })
  id: string;

  @ApiProperty({ description: 'ID do tipo de evento.', format: 'uuid' })
  eventTypeId: string;

  @ApiProperty({ description: 'Código do tipo de evento.' })
  eventTypeCode: string;

  @ApiProperty({ description: 'Tipo da entidade relacionada.' })
  entityType: string;

  @ApiProperty({ description: 'ID da entidade relacionada.', format: 'uuid' })
  entityId: string;

  @ApiProperty({ description: 'Texto livre sobre o evento.', nullable: true })
  note: string | null;

  @ApiProperty({ description: 'Metadados estruturados do evento.', nullable: true, type: 'object', additionalProperties: true })
  metadata: Record<string, unknown> | null;

  @ApiProperty({ description: 'Username do autor do evento.', nullable: true })
  createdBy: string | null;

  @ApiProperty({ description: 'Data de ocorrência do evento.' })
  createdAt: Date;

  @ApiLinksProperty({
    history: { href: '/events/product/550e8400-e29b-41d4-a716-446655440001', method: 'GET' },
    'event-type': { href: '/event-types/550e8400-e29b-41d4-a716-446655440000', method: 'GET' },
    entity: { href: '/products/550e8400-e29b-41d4-a716-446655440001', method: 'GET' },
  })
  _links?: Links;
}
