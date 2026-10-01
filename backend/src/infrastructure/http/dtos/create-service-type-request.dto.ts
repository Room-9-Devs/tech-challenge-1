import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateServiceTypeRequestDto {
  @ApiProperty({
    description: 'Descrição do tipo de serviço',
    example: 'Troca de óleo',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  description: string;

  @ApiProperty({
    description: 'Valor unitário do serviço',
    example: 120.5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  unitValue: number;
}
