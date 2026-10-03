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
import { ItemType, ItemUnit } from '@/domain/entities/item.entity';

export class CreateItemRequestDto {
  @ApiProperty({
    description: 'Item SKU',
    example: 'OLEO-5W30-1L',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku: string;

  @ApiProperty({
    description: 'Item name',
    example: 'Óleo 5W30 sintético',
    minLength: 2,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Item description',
    example: 'Óleo lubrificante sintético para motores a gasolina',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  @ApiProperty({
    description: 'Item type',
    enum: ItemType,
    example: ItemType.CONSUMABLE,
  })
  @IsEnum(ItemType)
  itemType: ItemType;

  @ApiProperty({
    description: 'Item unit of measure',
    enum: ItemUnit,
    example: ItemUnit.LITER,
  })
  @IsEnum(ItemUnit)
  unit: ItemUnit;

  @ApiProperty({
    description: 'Item cost',
    example: 35.9,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  cost: number;

  @ApiProperty({
    description: 'Item sale price',
    example: 59.9,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  salePrice: number;
}
