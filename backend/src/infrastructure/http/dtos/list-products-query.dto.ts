import { ApiHideProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ProductType, ProductUnit } from '@/domain/entities/product.entity';
import { PaginationQueryDto } from '@/shared/pagination/pagination-query.dto';
import { SortQueryDto } from '@/shared/pagination/sort-query.dto';

export class ListProductsFiltersDto {
  @IsOptional()
  @IsString()
  sku?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(ProductType)
  productType?: ProductType;

  @IsOptional()
  @IsEnum(ProductUnit)
  unit?: ProductUnit;

  [key: string]: string | number | boolean | undefined;
}

export class ListProductsQueryDto extends PaginationQueryDto {
  @ApiHideProperty()
  @IsOptional()
  @ValidateNested()
  @Type(() => ListProductsFiltersDto)
  filters?: ListProductsFiltersDto;

  @ApiHideProperty()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SortQueryDto)
  sort?: SortQueryDto[];
}
