import {
  Body,
  Controller,
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
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentUserInterceptor } from '../auth/current-user.interceptor';
import { CurrentUser as CurrentUserType } from '../auth/current-user.type';
import { EVENT_ENTITY_TYPES, EventEntityType } from '@/domain/types/entity-reference.type';
import { HateoasCollection, HateoasItem } from '../hateoas/hateoas.decorator';
import { eventLinks } from '../hateoas/resources/event.links';

@ApiTags('Eventos')
@Controller('events')
export class EventsController {
  constructor(
    private readonly recordEventUseCase: RecordEventUseCase,
    private readonly listEventsByEntityIdUseCase: ListEventsByEntityIdUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
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
    return this.recordEventUseCase.execute({
      ...dto,
      createdBy: dto.createdBy ?? currentUser?.username,
    });
  }

  @Get(':entityType/:entityId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Listar eventos por entidade' })
  @ApiParam({ name: 'entityType', description: 'Tipo da entidade', enum: EVENT_ENTITY_TYPES })
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
  ): Promise<EventResponseDto[]> {
    return this.listEventsByEntityIdUseCase.execute({ entityType, entityId });
  }
}
