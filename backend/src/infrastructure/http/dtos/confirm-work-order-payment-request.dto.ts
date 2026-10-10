import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ConfirmWorkOrderPaymentRequestDto {
  @ApiPropertyOptional({
    description: 'Observação opcional da confirmação manual do pagamento.',
    example: 'Pagamento confirmado no caixa por Maria.',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
