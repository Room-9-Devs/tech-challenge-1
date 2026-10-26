import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { EVENT_ENTITY_TYPES } from '@/domain/types/entity-reference.type';

export class CreateEventTypeRequestDto {
  @ApiProperty({
    description: 'Código único do tipo de evento (ex: user.created).',
    example: 'user.created',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @Matches(/^[a-z][a-z0-9_.]*$/, {
    message: 'O código deve ser um slug em minúsculas (ex: user.created)',
  })
  code: string;

  @ApiProperty({
    description: 'Nome legível do tipo de evento.',
    example: 'Usuário criado',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição opcional do tipo de evento.',
    example: 'Evento disparado quando uma conta de usuário é criada.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

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
