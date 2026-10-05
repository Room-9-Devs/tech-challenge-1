import { ApiHideProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { PaginationQueryDto } from '@/shared/pagination/pagination-query.dto';
import { SortQueryDto } from '@/shared/pagination/sort-query.dto';

export class ListRepairsFiltersDto {
  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  unitValue?: number;

  [key: string]: string | number | undefined;
}

export class ListRepairsQueryDto extends PaginationQueryDto {
  @ApiHideProperty()
  @IsOptional()
  @ValidateNested()
  @Type(() => ListRepairsFiltersDto)
  filters?: ListRepairsFiltersDto;

  @ApiHideProperty()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SortQueryDto)
  sort?: SortQueryDto[];
}
