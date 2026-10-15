import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { APPROVAL_REASON_MAX_LENGTH } from '../pages/work-order-approval.pages';

export class DecideWorkOrderApprovalRequestDto {
  @ApiPropertyOptional({
    description:
      'Motivo informado pelo cliente, registrado no histórico da OS. Usado principalmente na recusa.',
    example: 'Vou fazer o serviço em outra oficina.',
    maxLength: APPROVAL_REASON_MAX_LENGTH,
  })
  @IsOptional()
  @IsString()
  @MaxLength(APPROVAL_REASON_MAX_LENGTH)
  reason?: string;
}
