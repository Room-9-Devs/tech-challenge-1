import { ApiProperty } from '@nestjs/swagger';
import { RepairResponseDto } from './repair-response.dto';

export class ListRepairsResponseDto {
  @ApiProperty({
    description: 'Lista de tipos de reparo/serviço',
    type: [RepairResponseDto],
  })
  repairs: RepairResponseDto[];
}
