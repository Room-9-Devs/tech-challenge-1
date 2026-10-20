import { ApiProperty } from '@nestjs/swagger';
import { ApiLinksProperty } from '../hateoas/api-links-property.decorator';
import { Links } from '../hateoas/link.types';

export class ConfirmWorkOrderPaymentResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440020' })
  workOrderId: string;

  @ApiProperty({ example: true })
  confirmed: boolean;

  @ApiLinksProperty({
    'work-order': { href: '/work-orders/550e8400-e29b-41d4-a716-446655440020', method: 'GET' },
    start: { href: '/work-orders/550e8400-e29b-41d4-a716-446655440020/status', method: 'PATCH' },
    events: { href: '/events/work_order/550e8400-e29b-41d4-a716-446655440020', method: 'GET' },
  })
  _links?: Links;
}
