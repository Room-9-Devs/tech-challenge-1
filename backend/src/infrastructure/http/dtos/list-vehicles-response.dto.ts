import { ApiProperty } from '@nestjs/swagger';
import { VehicleResponseDto } from './vehicle-response.dto';
import { PaginationMetaDto } from './pagination-meta.dto';

export class ListVehiclesResponseDto {
  @ApiProperty({
    description: 'List of vehicles',
    type: [VehicleResponseDto],
  })
  data: VehicleResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;
}
