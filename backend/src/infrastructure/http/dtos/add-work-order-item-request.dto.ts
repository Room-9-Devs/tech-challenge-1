import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class AddWorkOrderItemRequestDto {
  @ApiPropertyOptional({
    description: 'UUID do reparo/serviço. Informe este campo ou productId.',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiPropertyOptional({
    description: 'UUID do produto. Informe este campo ou serviceId.',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiProperty({
    description:
      'Quantidade. Pode ser fracionária para serviços; produtos exigem valor inteiro.',
    example: 1.5,
    minimum: 0.001,
    maximum: 999999999.999,
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity: number;
}
