import { ApiProperty } from '@nestjs/swagger';
import { ServiceTypeResponseDto } from './service-type-response.dto';

export class ListServiceTypesResponseDto {
  @ApiProperty({
    description: 'List of service types',
    type: [ServiceTypeResponseDto],
  })
  serviceTypes: ServiceTypeResponseDto[];
}
