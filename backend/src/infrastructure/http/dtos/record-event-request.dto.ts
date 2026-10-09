import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { EVENT_ENTITY_TYPES } from '@/domain/types/entity-reference.type';

export class RecordEventRequestDto {
  @ApiProperty({
    description: 'Código do tipo de evento.',
    example: 'user.created',
  })
  @IsString()
  @IsNotEmpty()
  eventTypeCode: string;

  @ApiProperty({
    description: 'Tipo da entidade relacionada ao evento.',
    example: 'user',
    enum: EVENT_ENTITY_TYPES,
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(EVENT_ENTITY_TYPES)
  entityType: string;

  @ApiProperty({
    description: 'ID da entidade relacionada ao evento.',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  entityId: string;

  @ApiPropertyOptional({
    description: 'Texto livre opcional sobre o evento.',
    example: 'Usuário criado via importação em lote.',
  })
  @IsOptional()
  @IsString()
  note?: string | null;

  @ApiPropertyOptional({
    description: 'Metadados estruturados do evento.',
    example: { username: 'joao.silva', role: 'client' },
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown> | null;

  @ApiPropertyOptional({
    description: 'Username do autor do evento.',
    example: 'admin',
  })
  @IsOptional()
  @IsString()
  createdBy?: string | null;
}
