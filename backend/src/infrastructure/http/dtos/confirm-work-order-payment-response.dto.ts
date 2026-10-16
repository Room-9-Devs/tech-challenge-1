import { ApiProperty } from '@nestjs/swagger';

export class ConfirmWorkOrderPaymentResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440020' })
  workOrderId: string;

  @ApiProperty({ example: true })
  confirmed: boolean;
}
