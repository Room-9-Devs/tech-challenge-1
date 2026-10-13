import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '@/shared/pagination/pagination-query.dto';
import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';

export class ListWorkOrdersQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Filtra as OS por status.',
    enum: WorkOrderStatus,
    example: WorkOrderStatus.IN_PROGRESS,
  })
  @IsOptional()
  @IsEnum(WorkOrderStatus)
  status?: WorkOrderStatus;
}
