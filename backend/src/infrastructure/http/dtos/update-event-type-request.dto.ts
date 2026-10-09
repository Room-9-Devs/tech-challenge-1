import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { EVENT_ENTITY_TYPES } from '@/domain/types/entity-reference.type';

export class UpdateEventTypeRequestDto {
  @ApiPropertyOptional({
    description: 'Nome legível do tipo de evento.',
    example: 'Usuário criado',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Descrição opcional do tipo de evento.',
    example: 'Evento disparado quando uma conta de usuário é criada.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Entidades que podem emitir esse evento. Vazio = todas.',
    example: ['user'],
    enum: EVENT_ENTITY_TYPES,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsIn(EVENT_ENTITY_TYPES, { each: true })
  allowedEntityTypes?: string[];
}
