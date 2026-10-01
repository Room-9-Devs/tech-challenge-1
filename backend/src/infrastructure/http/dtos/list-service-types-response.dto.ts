import { ApiProperty } from '@nestjs/swagger';
import { ServiceTypeResponseDto } from './service-type-response.dto';

export class ListServiceTypesResponseDto {
  @ApiProperty({
    description: 'Lista de tipos de serviço',
    type: [ServiceTypeResponseDto],
  })
  serviceTypes: ServiceTypeResponseDto[];
}
