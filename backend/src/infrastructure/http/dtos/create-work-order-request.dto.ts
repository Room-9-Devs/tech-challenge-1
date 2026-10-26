import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateWorkOrderRequestDto {
  @ApiProperty({
    description: 'UUID do veículo para o qual a OS será aberta',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  vehicleId: string;

  @ApiPropertyOptional({
    description: 'Observações iniciais sobre o atendimento',
    example: 'Cliente relata ruído ao frear em baixa velocidade.',
  })
  @IsOptional()
  @IsString()
  observations?: string;
}
