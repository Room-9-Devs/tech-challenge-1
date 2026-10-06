import { ApiProperty } from '@nestjs/swagger';
import { VehicleResponseDto } from './vehicle-response.dto';

export class ListVehiclesResponseDto {
  @ApiProperty({
    description: 'List of vehicles',
    type: [VehicleResponseDto],
  })
  vehicles: VehicleResponseDto[];
}
