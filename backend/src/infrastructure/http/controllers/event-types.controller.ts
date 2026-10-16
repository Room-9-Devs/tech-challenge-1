import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CreateEventTypeUseCase } from '@/application/use-cases/events/event-type/create-event-type/create-event-type.use-case';
import { UpdateEventTypeUseCase } from '@/application/use-cases/events/event-type/update-event-type/update-event-type.use-case';
import { ListEventTypesUseCase } from '@/application/use-cases/events/event-type/list-event-types/list-event-types.use-case';
import { FindEventTypeUseCase } from '@/application/use-cases/events/event-type/find-event-type/find-event-type.use-case';
import { CreateEventTypeRequestDto } from '../dtos/create-event-type-request.dto';
import { UpdateEventTypeRequestDto } from '../dtos/update-event-type-request.dto';
import { EventTypeResponseDto } from '../dtos/event-type-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { HateoasCollection, HateoasItem } from '../hateoas/hateoas.decorator';
import { eventTypeLinks } from '../hateoas/resources/event.links';

@ApiTags('Tipos de Evento')
@Controller('event-types')
export class EventTypesController {
  constructor(
    private readonly createEventTypeUseCase: CreateEventTypeUseCase,
    private readonly updateEventTypeUseCase: UpdateEventTypeUseCase,
    private readonly listEventTypesUseCase: ListEventTypesUseCase,
    private readonly findEventTypeUseCase: FindEventTypeUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('access-token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastrar tipo de evento' })
  @ApiBody({ type: CreateEventTypeRequestDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tipo de evento cadastrado com sucesso',
    type: EventTypeResponseDto,
  })
  @HateoasItem(eventTypeLinks)
  async create(@Body() dto: CreateEventTypeRequestDto): Promise<EventTypeResponseDto> {
    return this.createEventTypeUseCase.execute(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Listar tipos de evento' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de tipos de evento',
    type: [EventTypeResponseDto],
  })
  @HateoasCollection(eventTypeLinks)
  async findAll(): Promise<EventTypeResponseDto[]> {
    return this.listEventTypesUseCase.execute();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Consultar tipo de evento por ID' })
  @ApiParam({ name: 'id', description: 'Event Type UUID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tipo de evento encontrado',
    type: EventTypeResponseDto,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Tipo de evento não encontrado' })
  @HateoasItem(eventTypeLinks)
  async findById(@Param('id') id: string): Promise<EventTypeResponseDto> {
    return this.findEventTypeUseCase.execute(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'staff')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Atualizar tipo de evento' })
  @ApiParam({ name: 'id', description: 'Event Type UUID' })
  @ApiBody({ type: UpdateEventTypeRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tipo de evento atualizado',
    type: EventTypeResponseDto,
  })
  @HateoasItem(eventTypeLinks)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEventTypeRequestDto,
  ): Promise<EventTypeResponseDto> {
    return this.updateEventTypeUseCase.execute({ id, ...dto });
  }
}
