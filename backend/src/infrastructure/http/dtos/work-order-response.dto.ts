import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import { WorkOrderItemResponseDto } from './work-order-item-response.dto';
import { ApiLinksProperty } from '../hateoas/api-links-property.decorator';
import { Links } from '../hateoas/link.types';

export class WorkOrderResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440020' })
  id: string;

  @ApiProperty({ example: 'OS-0001/2026' })
  number: string;

  @ApiProperty({ enum: WorkOrderStatus, example: WorkOrderStatus.RECEIVED })
  status: WorkOrderStatus;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  vehicleId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440030' })
  clientId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440040' })
  createdBy: string;

  @ApiPropertyOptional({
    example: 'Cliente relata ruído ao frear.',
    nullable: true,
  })
  observations: string | null;

  @ApiProperty({ type: [WorkOrderItemResponseDto] })
  items: WorkOrderItemResponseDto[];

  @ApiProperty({
    example: 180.75,
    description: 'Total calculado pela soma dos subtotais dos itens.',
  })
  totalPrice: number;

  @ApiProperty({ example: '2026-10-10T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-10-10T12:00:00.000Z' })
  updatedAt: Date;

  @ApiLinksProperty({
    self: { href: '/work-orders/550e8400-e29b-41d4-a716-446655440020', method: 'GET' },
    vehicle: { href: '/vehicles/550e8400-e29b-41d4-a716-446655440000', method: 'GET' },
    client: { href: '/users/550e8400-e29b-41d4-a716-446655440030', method: 'GET' },
    events: { href: '/events/work_order/550e8400-e29b-41d4-a716-446655440020', method: 'GET' },
    'add-item': { href: '/work-orders/550e8400-e29b-41d4-a716-446655440020/items', method: 'POST' },
    'start-diagnosis': { href: '/work-orders/550e8400-e29b-41d4-a716-446655440020/status', method: 'PATCH' },
  })
  _links?: Links;
}

export class WorkOrderVehicleResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'ABC1D23' })
  licensePlate: string;

  @ApiProperty({ example: 'Civic' })
  model: string;

  @ApiProperty({ example: 'Honda' })
  brand: string;

  @ApiProperty({ example: 2022 })
  year: number;

  @ApiProperty({ example: 'Prata' })
  color: string;
}

export class WorkOrderClientProfileResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440031' })
  id: string;

  @ApiProperty({ example: 'Cliente Exemplo' })
  name: string;

  @ApiProperty({ example: '(11) 99999-9999' })
  phone: string;
}

export class WorkOrderClientResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440030' })
  id: string;

  @ApiProperty({ example: 'cliente.exemplo' })
  username: string;

  @ApiProperty({ example: 'cliente@example.com' })
  email: string;

  @ApiProperty({ type: () => WorkOrderClientProfileResponseDto, nullable: true })
  profile: WorkOrderClientProfileResponseDto | null;
}

export class WorkOrderDetailResponseDto extends WorkOrderResponseDto {
  @ApiProperty({
    description: 'Veículo relacionado à ordem de serviço.',
    type: () => WorkOrderVehicleResponseDto,
    nullable: true,
  })
  vehicle: WorkOrderVehicleResponseDto | null;

  @ApiProperty({
    description: 'Conta e perfil do cliente proprietário do veículo.',
    type: () => WorkOrderClientResponseDto,
    nullable: true,
  })
  client: WorkOrderClientResponseDto | null;
}
