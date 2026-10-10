import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class ChangeWorkOrderItemRequestDto {
  @ApiProperty({
    description:
      'Nova quantidade do item. Quantidades de produtos devem ser inteiras.',
    example: 2,
    minimum: 0.001,
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity: number;
}
