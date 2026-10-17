import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateWorkOrderUseCase } from '@/application/use-cases/work-orders/create-work-order/create-work-order.use-case';
import { ListWorkOrdersUseCase } from '@/application/use-cases/work-orders/list-work-orders/list-work-orders.use-case';
import { FindWorkOrderUseCase } from '@/application/use-cases/work-orders/find-work-order/find-work-order.use-case';
import { AddWorkOrderItemUseCase } from '@/application/use-cases/work-orders/add-work-order-item/add-work-order-item.use-case';
import { ChangeWorkOrderItemUseCase } from '@/application/use-cases/work-orders/change-work-order-item/change-work-order-item.use-case';
import { RemoveWorkOrderItemUseCase } from '@/application/use-cases/work-orders/remove-work-order-item/remove-work-order-item.use-case';
import { ChangeWorkOrderStatusUseCase } from '@/application/use-cases/work-orders/change-work-order-status/change-work-order-status.use-case';
import { ConfirmWorkOrderPaymentUseCase } from '@/application/use-cases/work-orders/confirm-work-order-payment/confirm-work-order-payment.use-case';
import { GetWorkOrderStatsDetailUseCase } from '@/application/use-cases/work-order-stats/get-work-order-stats-detail/get-work-order-stats-detail.use-case';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentUser as CurrentUserType } from '../auth/current-user.type';
import { CurrentUserInterceptor } from '../auth/current-user.interceptor';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreateWorkOrderRequestDto } from '../dtos/create-work-order-request.dto';
import { AddWorkOrderItemRequestDto } from '../dtos/add-work-order-item-request.dto';
import { ChangeWorkOrderItemRequestDto } from '../dtos/change-work-order-item-request.dto';
import { ChangeWorkOrderStatusRequestDto } from '../dtos/change-work-order-status-request.dto';
import { ConfirmWorkOrderPaymentRequestDto } from '../dtos/confirm-work-order-payment-request.dto';
import { ListWorkOrdersQueryDto } from '../dtos/list-work-orders-query.dto';
import {
  WorkOrderResponseDto,
  WorkOrderDetailResponseDto,
} from '../dtos/work-order-response.dto';
import { ListWorkOrdersResponseDto } from '../dtos/list-work-orders-response.dto';
import { ConfirmWorkOrderPaymentResponseDto } from '../dtos/confirm-work-order-payment-response.dto';
import { WorkOrderStatsDetailResponseDto } from '../dtos/work-order-stats-detail-response.dto';
import { parseSortQuery } from '@/shared/pagination/parse-sort-query';
import { parseFiltersQuery } from '@/shared/pagination/parse-filters-query';
import { WorkOrder } from '@/domain/entities/work-order.entity';
import { WorkOrderItem } from '@/domain/entities/work-order-item.entity';
import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';

const itemView = (i: WorkOrderItem) => ({
  id: i.id,
  serviceId: i.serviceId,
  productId: i.productId,
  quantity: i.quantity,
  unitPrice: i.unitPrice,
  subtotal: i.subtotal,
  createdAt: i.createdAt,
  updatedAt: i.updatedAt,
});
const orderView = (o: WorkOrder) => ({
  id: o.id,
  number: o.number,
  status: o.status,
  vehicleId: o.vehicleId,
  clientId: o.clientId,
  createdBy: o.createdBy,
  observations: o.observations,
  items: o.items.map(itemView),
  totalPrice: o.totalPrice,
  createdAt: o.createdAt,
  updatedAt: o.updatedAt,
});

const WORK_ORDER_ID_EXAMPLE = '550e8400-e29b-41d4-a716-446655440020';
const WORK_ORDER_ITEM_ID_EXAMPLE = '550e8400-e29b-41d4-a716-446655440010';
const toWorkOrderActor = (user: CurrentUserType) => ({
  id: user.id,
  username: user.username,
  entityType: user.entityType,
});

@ApiTags('Ordens de Serviço')
@ApiBearerAuth('access-token')
@Controller('work-orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(CurrentUserInterceptor)
@ApiResponse({
  status: HttpStatus.UNAUTHORIZED,
  description: 'Autenticação obrigatória',
})
export class WorkOrdersController {
  constructor(
    private readonly createWorkOrder: CreateWorkOrderUseCase,
    private readonly listWorkOrders: ListWorkOrdersUseCase,
    private readonly findWorkOrder: FindWorkOrderUseCase,
    private readonly addWorkOrderItem: AddWorkOrderItemUseCase,
    private readonly changeWorkOrderItem: ChangeWorkOrderItemUseCase,
    private readonly removeWorkOrderItem: RemoveWorkOrderItemUseCase,
    private readonly changeWorkOrderStatus: ChangeWorkOrderStatusUseCase,
    private readonly confirmWorkOrderPayment: ConfirmWorkOrderPaymentUseCase,
    private readonly getWorkOrderStatsDetail: GetWorkOrderStatsDetailUseCase,
  ) {}

  @Post()
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Abre uma ordem de serviço para um veículo' })
  @ApiBody({ type: CreateWorkOrderRequestDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Ordem de serviço criada',
    type: WorkOrderResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Veículo sem cliente associado ou dados inválidos',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Veículo não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Apenas equipe pode abrir uma OS',
  })
  async create(
    @Body() body: CreateWorkOrderRequestDto,
    @CurrentUser() actor: CurrentUserType,
  ) {
    return orderView(
      await this.createWorkOrder.execute({
        ...body,
        actor: toWorkOrderActor(actor),
      }),
    );
  }

  @Get()
  @Roles('admin', 'staff', 'client')
  @ApiOperation({
    summary: 'Lista ordens de serviço; clientes visualizam somente as próprias',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Página da consulta (inicia em 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Itens por página; máximo 100',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    example: 'OS-0001/2026',
    description: 'Busca por número da OS ou placa do veículo',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: [
      'received',
      'under_diagnosis',
      'awaiting_approval',
      'approved',
      'in_progress',
      'completed',
      'delivered',
      'cancelled',
    ],
    example: 'in_progress',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description:
      'JSON de ordenação. Ex: [{"field":"createdAt","order":"desc"}]',
    example: '[{"field":"createdAt","order":"desc"}]',
  })
  @ApiQuery({
    name: 'filters',
    required: false,
    type: String,
    description:
      'JSON de filtros por status e/ou veículo. Ex: {"status":"in_progress","vehicleId":"550e8400-e29b-41d4-a716-446655440000"}',
    example:
      '{"status":"in_progress","vehicleId":"550e8400-e29b-41d4-a716-446655440000"}',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista paginada de ordens de serviço',
    type: ListWorkOrdersResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parâmetros de consulta inválidos',
  })
  async list(
    @Query() query: ListWorkOrdersQueryDto,
    @CurrentUser() actor: CurrentUserType,
  ) {
    const filters = parseFiltersQuery(query.filters, [
      'status',
      'vehicleId',
    ]) as Record<string, string | number> | undefined;
    if (
      filters?.status &&
      !Object.values(WorkOrderStatus).includes(
        filters.status as WorkOrderStatus,
      )
    ) {
      throw new BadRequestException(
        `filter status must be one of: ${Object.values(WorkOrderStatus).join(', ')}`,
      );
    }
    if (
      filters?.vehicleId &&
      (typeof filters.vehicleId !== 'string' || !isUUID(filters.vehicleId))
    ) {
      throw new BadRequestException('filter vehicleId must be a valid UUID');
    }
    if (query.status) {
      if (filters?.status && filters.status !== query.status) {
        throw new BadRequestException(
          'status query parameter conflicts with filters.status',
        );
      }
      if (filters) filters.status = query.status;
    }
    const result = await this.listWorkOrders.execute({
      query: {
        page: Number(query.page ?? 1),
        limit: Number(query.limit ?? 10),
        search: query.search,
        sort: parseSortQuery(query.sort, [
          'number',
          'status',
          'totalPrice',
          'createdAt',
          'updatedAt',
        ]),
        filters:
          filters ?? (query.status ? { status: query.status } : undefined),
      },
      actor: toWorkOrderActor(actor),
    });
    return { ...result, data: result.data.map(orderView) };
  }

  @Get(':id')
  @Roles('admin', 'staff', 'client')
  @ApiOperation({ summary: 'Consulta uma ordem de serviço com itens e total' })
  @ApiParam({
    name: 'id',
    description: 'UUID da ordem de serviço',
    example: WORK_ORDER_ID_EXAMPLE,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detalhe da OS com veículo, cliente e itens',
    type: WorkOrderDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ordem de serviço não encontrada',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cliente só pode consultar as próprias OS',
  })
  async find(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: CurrentUserType,
  ) {
    const result = await this.findWorkOrder.execute({
      id,
      actor: toWorkOrderActor(actor),
    });
    const vehicle = result.vehicle;
    return {
      ...orderView(result.order),
      vehicle: vehicle
        ? {
            id: vehicle.id,
            licensePlate: vehicle.license_plate,
            model: vehicle.model,
            brand: vehicle.brand,
            year: vehicle.year,
            color: vehicle.color,
          }
        : null,
      client: result.client
        ? {
            id: result.client.id,
            username: result.client.username,
            email: result.client.email,
            profile: result.profile
              ? {
                  id: result.profile.id,
                  name: result.profile.name,
                  phone: result.profile.phone,
                }
              : null,
          }
        : null,
    };
  }

  @Get(':id/stats')
  @Roles('admin', 'staff', 'client')
  @ApiOperation({
    summary:
      'Estatísticas individuais da OS com comparativo das médias globais da oficina',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da ordem de serviço',
    example: WORK_ORDER_ID_EXAMPLE,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Duração de cada etapa do ciclo de vida da OS, tempo total e tempo no status atual, com a média global correspondente para comparação',
    type: WorkOrderStatsDetailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ordem de serviço não encontrada',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Cliente só pode consultar as próprias OS',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Autenticação obrigatória',
  })
  async stats(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: CurrentUserType,
  ): Promise<WorkOrderStatsDetailResponseDto> {
    return this.getWorkOrderStatsDetail.execute({
      id,
      actor: toWorkOrderActor(actor),
    });
  }

  @Post(':id/items')
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Adiciona serviço ou produto ao orçamento da OS' })
  @ApiParam({
    name: 'id',
    description: 'UUID da ordem de serviço',
    example: WORK_ORDER_ID_EXAMPLE,
  })
  @ApiBody({
    type: AddWorkOrderItemRequestDto,
    examples: {
      servico: {
        summary: 'Adicionar serviço',
        value: {
          serviceId: '550e8400-e29b-41d4-a716-446655440001',
          quantity: 1.5,
        },
      },
      produto: {
        summary: 'Adicionar produto',
        value: {
          productId: '550e8400-e29b-41d4-a716-446655440002',
          quantity: 2,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Item adicionado; preço unitário congelado do catálogo',
    type: WorkOrderResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Informe exatamente um serviço ou produto; produtos exigem quantidade inteira',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'OS ou item de catálogo não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Saldo de estoque insuficiente',
  })
  async addItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AddWorkOrderItemRequestDto,
    @CurrentUser() actor: CurrentUserType,
  ) {
    return orderView(
      await this.addWorkOrderItem.execute({
        id,
        ...body,
        actor: toWorkOrderActor(actor),
      }),
    );
  }

  @Patch(':id/items/:itemId')
  @Roles('admin', 'staff')
  @ApiOperation({
    summary: 'Altera a quantidade de um item antes do envio do orçamento',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da ordem de serviço',
    example: WORK_ORDER_ID_EXAMPLE,
  })
  @ApiParam({
    name: 'itemId',
    description: 'UUID do item da OS',
    example: WORK_ORDER_ITEM_ID_EXAMPLE,
  })
  @ApiBody({ type: ChangeWorkOrderItemRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Quantidade atualizada e total recalculado',
    type: WorkOrderResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Quantidade inválida ou OS não permite alteração de itens',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'OS ou item não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Saldo de estoque insuficiente',
  })
  async changeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() body: ChangeWorkOrderItemRequestDto,
    @CurrentUser() actor: CurrentUserType,
  ) {
    return orderView(
      await this.changeWorkOrderItem.execute({
        id,
        itemId,
        quantity: body.quantity,
        actor: toWorkOrderActor(actor),
      }),
    );
  }

  @Delete(':id/items/:itemId')
  @Roles('admin', 'staff')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove um item antes do envio do orçamento' })
  @ApiParam({
    name: 'id',
    description: 'UUID da ordem de serviço',
    example: WORK_ORDER_ID_EXAMPLE,
  })
  @ApiParam({
    name: 'itemId',
    description: 'UUID do item da OS',
    example: WORK_ORDER_ITEM_ID_EXAMPLE,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item removido e total recalculado',
    type: WorkOrderResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'OS ou item não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Itens só podem ser removidos antes do envio do orçamento',
  })
  async removeItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @CurrentUser() actor: CurrentUserType,
  ) {
    return orderView(
      await this.removeWorkOrderItem.execute({
        id,
        itemId,
        actor: toWorkOrderActor(actor),
      }),
    );
  }

  @Patch(':id/status')
  @Roles('admin', 'staff', 'client')
  @ApiOperation({
    summary: 'Altera status da OS ou registra a decisão do cliente',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da ordem de serviço',
    example: WORK_ORDER_ID_EXAMPLE,
  })
  @ApiBody({
    type: ChangeWorkOrderStatusRequestDto,
    examples: {
      iniciarDiagnostico: {
        summary: 'Equipe inicia o diagnóstico do veículo',
        value: {
          status: 'under_diagnosis',
          reason: 'Veículo recebido e encaminhado para diagnóstico.',
        },
      },
      enviarOrcamento: {
        summary: 'Equipe envia orçamento',
        value: {
          status: 'awaiting_approval',
          reason: 'Diagnóstico concluído e orçamento enviado.',
        },
      },
      aprovar: {
        summary: 'Cliente aprova orçamento',
        value: {
          status: 'approved',
          reason: 'Orçamento aprovado pelo cliente.',
        },
      },
      recusar: {
        summary: 'Cliente recusa orçamento',
        value: {
          status: 'cancelled',
          reason: 'Orçamento recusado pelo cliente.',
        },
      },
      concluirServico: {
        summary: 'Equipe conclui o serviço aprovado',
        description:
          'Use após o cliente aprovar o orçamento, o pagamento ser confirmado e o serviço entrar em execução.',
        value: {
          status: 'completed',
          reason: 'Serviço concluído conforme o orçamento aprovado.',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Status atualizado; transições e estoque tratados conforme o fluxo',
    type: WorkOrderResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Motivo obrigatório, transição inválida ou orçamento sem itens',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Ação não permitida para o papel ou cliente',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ordem de serviço não encontrada',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Estoque insuficiente ou pagamento ainda não confirmado',
  })
  async changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ChangeWorkOrderStatusRequestDto,
    @CurrentUser() actor: CurrentUserType,
  ) {
    return orderView(
      await this.changeWorkOrderStatus.execute({
        id,
        status: body.status,
        note: body.reason,
        actor: toWorkOrderActor(actor),
      }),
    );
  }

  @Post(':id/payment-confirmation')
  @Roles('admin', 'staff')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Registra confirmação manual do pagamento após aprovação do orçamento',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da ordem de serviço',
    example: WORK_ORDER_ID_EXAMPLE,
  })
  @ApiBody({ type: ConfirmWorkOrderPaymentRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Confirmação registrada no histórico da OS',
    type: ConfirmWorkOrderPaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'OS não está aprovada ou pagamento já confirmado',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Ordem de serviço não encontrada',
  })
  async confirmPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ConfirmWorkOrderPaymentRequestDto,
    @CurrentUser() actor: CurrentUserType,
  ) {
    return this.confirmWorkOrderPayment.execute({
      id,
      note: body.note,
      actor: toWorkOrderActor(actor),
    });
  }
}
