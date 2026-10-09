import { ApiProperty } from '@nestjs/swagger';

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
}
