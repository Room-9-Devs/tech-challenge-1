import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';

class WorkOrderStageGlobalDto {
  @ApiProperty({ description: 'Tag da estatística global correspondente', example: 'avg_time_from_received_to_under_diagnosis' })
  tag: string;

  @ApiProperty({ description: 'Média global da oficina para a etapa', example: '7d 0h 0m' })
  value: string;
}

class WorkOrderStageDto {
  @ApiProperty({
    description: 'Status de entrada que encerra a etapa',
    enum: WorkOrderStatus,
    example: WorkOrderStatus.UNDER_DIAGNOSIS,
  })
  tag: WorkOrderStatus;

  @ApiProperty({ description: 'Nome da etapa', example: 'Fila para diagnóstico' })
  name: string;

  @ApiProperty({ description: 'Explicação do cálculo da etapa' })
  hint: string;

  @ApiPropertyOptional({ description: 'Instante do marco inicial da etapa (ISO) ou null', type: String, nullable: true })
  startedAt: Date | null;

  @ApiPropertyOptional({ description: 'Instante do marco final da etapa (ISO) ou null', type: String, nullable: true })
  endedAt: Date | null;

  @ApiPropertyOptional({
    description: 'Duração fechada da etapa (marco inicial e final existentes)',
    example: '2d 4h 0m',
    nullable: true,
  })
  duration: string | null;

  @ApiPropertyOptional({
    description: 'Duração em curso (etapa iniciada, ainda aberta e OS não encerrada)',
    example: '1d 8h 0m',
    nullable: true,
  })
  pendingDuration: string | null;

  @ApiPropertyOptional({ type: WorkOrderStageGlobalDto, nullable: true })
  global: WorkOrderStageGlobalDto | null;
}

class WorkOrderTotalDto {
  @ApiProperty({ description: 'Nome da estatística', example: 'Tempo total da ordem de serviço' })
  name: string;

  @ApiProperty({ description: 'Explicação do cálculo' })
  hint: string;

  @ApiPropertyOptional({ description: 'Duração fechada: da criação à conclusão', example: '5d 16h 0m', nullable: true })
  duration: string | null;

  @ApiPropertyOptional({ description: 'Duração em curso (OS aberta e não concluída)', example: '1d 2h 0m', nullable: true })
  pendingDuration: string | null;

  @ApiProperty({ type: WorkOrderStageGlobalDto })
  global: WorkOrderStageGlobalDto;
}

class WorkOrderCurrentStatusDto {
  @ApiProperty({ description: 'Status atual da OS', enum: WorkOrderStatus })
  status: WorkOrderStatus;

  @ApiProperty({ description: 'Instante em que a OS entrou neste status (ISO)', type: String })
  since: Date;

  @ApiProperty({ description: 'Tempo no status atual', example: '3d 1h 0m' })
  duration: string;
}

export class WorkOrderStatsDetailResponseDto {
  @ApiProperty({ description: 'Id da ordem de serviço', example: '550e8400-e29b-41d4-a716-446655440020' })
  id: string;

  @ApiProperty({ description: 'Número da ordem de serviço', example: 'OS-0001/2026' })
  number: string;

  @ApiProperty({ description: 'Status atual da OS', enum: WorkOrderStatus })
  status: WorkOrderStatus;

  @ApiProperty({ description: 'Instante de criação da OS (ISO)', type: String })
  createdAt: Date;

  @ApiProperty({
    description:
      'Etapas do ciclo de vida da OS, na ordem do fluxo, cada uma com a duração individual e a média global correspondente',
    type: WorkOrderStageDto,
    isArray: true,
  })
  stages: WorkOrderStageDto[];

  @ApiProperty({ type: WorkOrderTotalDto })
  total: WorkOrderTotalDto;

  @ApiProperty({ type: WorkOrderCurrentStatusDto })
  currentStatus: WorkOrderCurrentStatusDto;
}
