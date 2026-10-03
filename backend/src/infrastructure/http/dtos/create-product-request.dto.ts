import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ProductType, ProductUnit } from '@/domain/entities/product.entity';

export class CreateProductRequestDto {
  @ApiProperty({
    description: 'SKU do produto',
    example: 'OLEO-5W30-1L',
    maxLength: 100,
  })
  @IsString({ message: 'O SKU deve ser uma string' })
  @IsNotEmpty({ message: 'O SKU é obrigatório' })
  @MaxLength(100, { message: 'O SKU deve ter no máximo 100 caracteres' })
  sku: string;

  @ApiProperty({
    description: 'Nome do produto',
    example: 'Óleo 5W30 sintético',
    minLength: 2,
    maxLength: 255,
  })
  @IsString({ message: 'O nome deve ser uma string' })
  @IsNotEmpty({ message: 'O nome é obrigatório' })
  @MinLength(2, { message: 'O nome deve ter pelo menos 2 caracteres' })
  @MaxLength(255, { message: 'O nome deve ter no máximo 255 caracteres' })
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição do produto',
    example: 'Óleo lubrificante sintético para motores a gasolina',
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'A descrição deve ser uma string' })
  @MaxLength(255, { message: 'A descrição deve ter no máximo 255 caracteres' })
  description?: string;

  @ApiProperty({
    description: 'Tipo do produto',
    enum: ProductType,
    example: ProductType.CONSUMABLE,
  })
  @IsEnum(ProductType, {
    message: 'O tipo do produto deve ser PART ou CONSUMABLE',
  })
  productType: ProductType;

  @ApiProperty({
    description: 'Unidade de medida do produto',
    enum: ProductUnit,
    example: ProductUnit.LITER,
  })
  @IsEnum(ProductUnit, {
    message: 'A unidade deve ser UNIT, LITER, KILOGRAM ou METER',
  })
  unit: ProductUnit;

  @ApiProperty({
    description: 'Custo do produto',
    example: 35.9,
    minimum: 0,
  })
  @IsNumber({}, { message: 'O custo deve ser um número' })
  @Min(0, { message: 'O custo deve ser maior ou igual a 0' })
  cost: number;

  @ApiProperty({
    description: 'Preço de venda do produto',
    example: 59.9,
    minimum: 0,
  })
  @IsNumber({}, { message: 'O preço de venda deve ser um número' })
  @Min(0, { message: 'O preço de venda deve ser maior ou igual a 0' })
  salePrice: number;
}
