import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdateRepairRequestDto {
  @ApiProperty({
    description: 'Descrição do tipo de reparo/serviço',
    example: 'Troca de óleo',
    minLength: 2,
    maxLength: 255,
  })
  @IsString({ message: 'A descrição deve ser uma string' })
  @IsNotEmpty({ message: 'A descrição é obrigatória' })
  @MinLength(2, { message: 'A descrição deve ter pelo menos 2 caracteres' })
  @MaxLength(255, { message: 'A descrição deve ter no máximo 255 caracteres' })
  description: string;

  @ApiProperty({
    description: 'Valor unitário do reparo/serviço',
    example: 120.5,
    minimum: 0,
  })
  @IsNumber({}, { message: 'O valor unitário deve ser um número' })
  @Min(0, { message: 'O valor unitário deve ser maior ou igual a 0' })
  unitValue: number;
}
