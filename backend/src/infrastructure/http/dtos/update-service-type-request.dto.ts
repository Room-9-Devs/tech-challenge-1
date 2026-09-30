import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdateServiceTypeRequestDto {
  @ApiProperty({
    description: 'Service type description',
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
    description: 'Unit value of the service',
    example: 120.5,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  unitValue: number;
}
