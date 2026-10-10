import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength } from 'class-validator';
import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';

export class ChangeWorkOrderStatusRequestDto {
  @ApiProperty({
    description:
      'Próximo status da OS, sujeito às transições permitidas no fluxo.',
    enum: WorkOrderStatus,
    example: WorkOrderStatus.AWAITING_APPROVAL,
  })
  @IsEnum(WorkOrderStatus)
  status: WorkOrderStatus;

  @ApiProperty({
    description: 'Motivo obrigatório, registrado no histórico da OS.',
    example: 'Diagnóstico concluído; orçamento enviado ao cliente.',
    minLength: 1,
  })
  @IsString()
  @MinLength(1)
  reason: string;
}
