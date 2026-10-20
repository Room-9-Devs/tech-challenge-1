import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RecordEventUseCase } from '@/application/use-cases/events/record-event/record-event.use-case';
import { ListEventsByEntityIdUseCase } from '@/application/use-cases/events/list-events-by-entity-id/list-events-by-entity-id.use-case';
import { RecordEventRequestDto } from '../dtos/record-event-request.dto';
import { EventResponseDto } from '../dtos/event-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentUserInterceptor } from '../auth/current-user.interceptor';
import { CurrentUser as CurrentUserType } from '../auth/current-user.type';
import { HateoasCollection, HateoasItem } from '../hateoas/hateoas.decorator';
import { eventLinks } from '../hateoas/resources/event.links';
import { EVENT_ENTITY_TYPES, EventEntityType } from '@/domain/types/entity-reference.type';
import { FindWorkOrderUseCase } from '@/application/use-cases/work-orders/find-work-order/find-work-order.use-case';

@ApiTags('Eventos')
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'staff')
export class EventsController {
  constructor(
    private readonly recordEventUseCase: RecordEventUseCase,
    private readonly listEventsByEntityIdUseCase: ListEventsByEntityIdUseCase,
    private readonly findWorkOrder: FindWorkOrderUseCase,
  ) {}

  @Post()
  @UseInterceptors(CurrentUserInterceptor)
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar evento manualmente' })
  @ApiBody({ type: RecordEventRequestDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Evento registrado com sucesso',
    type: EventResponseDto,
  })
  @HateoasItem(eventLinks)
  async create(
    @Body() dto: RecordEventRequestDto,
    @CurrentUser() currentUser: CurrentUserType,
  ): Promise<EventResponseDto> {
    if (dto.entityType === 'work_order') {
      throw new ForbiddenException(
        'Eventos de ordem de serviço são gerados pelo sistema',
      );
    }
    return this.recordEventUseCase.execute({
      ...dto,
      createdBy: currentUser.username, // nunca aceitar do body
    });
  }

  @Get(':entityType/:entityId')
  @UseInterceptors(CurrentUserInterceptor)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Listar eventos por entidade' })
  @ApiParam({
    name: 'entityType',
    description: 'Tipo da entidade',
    enum: EVENT_ENTITY_TYPES,
  })
  @ApiParam({ name: 'entityId', description: 'ID da entidade', format: 'uuid' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de eventos da entidade',
    type: [EventResponseDto],
  })
  @HateoasCollection(eventLinks)
  async findByEntity(
    @Param('entityType') entityType: EventEntityType,
    @Param('entityId') entityId: string,
    @CurrentUser() currentUser: CurrentUserType,
  ): Promise<EventResponseDto[]> {
    if (entityType === 'work_order') {
      await this.findWorkOrder.execute({
        id: entityId,
        actor: {
          id: currentUser.id,
          username: currentUser.username,
          entityType: currentUser.entityType,
        },
      });
    }
    return this.listEventsByEntityIdUseCase.execute({ entityType, entityId });
  }
}
