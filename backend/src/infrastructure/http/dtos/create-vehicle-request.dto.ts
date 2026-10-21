import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateVehicleRequestDto {
  @ApiProperty({
    description:
      'Placa do veículo no formato antigo (ABC-1234 ou ABC1234) ou Mercosul (ABC1D23), em maiúsculas ou minúsculas. É gravada sem hífen e em maiúsculas.',
    example: 'ABC1D23',
    pattern: '^(?:[A-Za-z]{3}-?\\d{4}|[A-Za-z]{3}\\d[A-Za-z]\\d{2})$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(?:[A-Z]{3}-?\d{4}|[A-Z]{3}\d[A-Z]\d{2})$/i, {
    message:
      'license_plate must follow the old format ABC-1234 or Mercosur format ABC1D23',
  })
  license_plate: string;

  @ApiProperty({
    description: 'Vehicle model',
    example: 'Corolla',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  model: string;

  @ApiProperty({
    description: 'Vehicle brand',
    example: 'Toyota',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  brand: string;

  @ApiProperty({
    description: 'Vehicle manufacturing year',
    example: 2022,
    minimum: 1886,
    maximum: new Date().getFullYear() + 1,
  })
  @IsInt()
  @Min(1886)
  @Max(new Date().getFullYear() + 1)
  year: number;

  @ApiProperty({
    description: 'Vehicle color',
    example: 'Black',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  color: string;
}
