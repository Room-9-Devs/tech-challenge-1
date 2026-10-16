import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from './pagination-meta.dto';
import { WorkOrderResponseDto } from './work-order-response.dto';

export class ListWorkOrdersResponseDto {
  @ApiProperty({ type: [WorkOrderResponseDto] })
  data: WorkOrderResponseDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}
