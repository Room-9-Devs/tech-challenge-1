import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { isUUID } from 'class-validator';
import { ListStockUseCase } from '@/application/use-cases/stock/list-stock/list-stock.use-case';
import { ListStockFiltersInputDto } from '@/application/use-cases/stock/list-stock/list-stock-input.dto';
import { CreateStockMovementUseCase } from '@/application/use-cases/stock/create-stock-movement/create-stock-movement.use-case';
import { ListStockMovementsUseCase } from '@/application/use-cases/stock/list-stock-movements/list-stock-movements.use-case';
import { ListStockMovementsFiltersInputDto } from '@/application/use-cases/stock/list-stock-movements/list-stock-movements-input.dto';
import { AccessTokenPayload } from '@/application/ports/token-service.port';
import { StockMovementType } from '@/domain/entities/stock-movement.entity';
import { ListStockQueryDto } from '../dtos/list-stock-query.dto';
import { ListStockResponseDto } from '../dtos/list-stock-response.dto';
import { ListStockMovementsQueryDto } from '../dtos/list-stock-movements-query.dto';
import { ListStockMovementsResponseDto } from '../dtos/list-stock-movements-response.dto';
import { CreateStockMovementRequestDto } from '../dtos/create-stock-movement-request.dto';
import { StockMovementResponseDto } from '../dtos/stock-movement-response.dto';
import { parseFiltersQuery } from '@/shared/pagination/parse-filters-query';
import { parseSortQuery } from '@/shared/pagination/parse-sort-query';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentUserInterceptor } from '../auth/current-user.interceptor';
import { CurrentUser as CurrentUserType } from '../auth/current-user.type';

const ALLOWED_STOCK_SORT_COLUMNS = [
  'quantity',
  'reserved',
  'createdAt',
  'updatedAt',
];

const ALLOWED_STOCK_FILTERS = ['productId'];

const ALLOWED_STOCK_MOVEMENT_SORT_COLUMNS = [
  'createdAt',
  'quantity',
  'movementType',
];

const ALLOWED_STOCK_MOVEMENT_FILTERS = [
  'productId',
  'movementType',
  'createdBy',
];

@ApiTags('Estoque')
@ApiBearerAuth('access-token')
@Controller('stock')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'staff')
@ApiResponse({
  status: HttpStatus.UNAUTHORIZED,
  description: 'Autenticação obrigatória',
})
@ApiResponse({
  status: HttpStatus.FORBIDDEN,
  description: 'Usuário sem permissão para gerenciar o estoque',
})
export class StockController {
  constructor(
    private readonly listStockUseCase: ListStockUseCase,
    private readonly createStockMovementUseCase: CreateStockMovementUseCase,
    private readonly listStockMovementsUseCase: ListStockMovementsUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Consulta o estado atual do estoque com paginação, busca e filtros',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'filtro de óleo' })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description: 'JSON de ordenação. Ex: [{"field":"quantity","order":"asc"}]',
    example: '[{"field":"quantity","order":"asc"}]',
  })
  @ApiQuery({
    name: 'filters',
    required: false,
    type: String,
    description:
      'JSON de filtros. Ex: {"productId":"550e8400-e29b-41d4-a716-446655440000"}',
    example: '{"productId":"550e8400-e29b-41d4-a716-446655440000"}',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista paginada do estoque',
    type: ListStockResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parâmetros de consulta inválidos',
  })
  async findAll(@Query() query: ListStockQueryDto): Promise<ListStockResponseDto> {
    const filters = parseFiltersQuery(
      query.filters,
      ALLOWED_STOCK_FILTERS,
    ) as ListStockFiltersInputDto;

    if (filters?.productId !== undefined && !isUUID(filters.productId)) {
      throw new BadRequestException('filter productId must be a valid UUID');
    }

    return this.listStockUseCase.execute({
      page: query.page,
      limit: query.limit,
      search: query.search,
      sort: parseSortQuery(query.sort, ALLOWED_STOCK_SORT_COLUMNS),
      filters,
    });
  }

  @Get('movements')
  @ApiOperation({
    summary:
      'Lista o histórico de movimentações de estoque com paginação, busca, filtros e período',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'filtro de óleo' })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description: 'JSON de ordenação. Ex: [{"field":"createdAt","order":"desc"}]',
    example: '[{"field":"createdAt","order":"desc"}]',
  })
  @ApiQuery({
    name: 'filters',
    required: false,
    type: String,
    description:
      'JSON de filtros com productId, movementType e/ou createdBy. Ex: {"movementType":"OUT"}',
    example: '{"movementType":"OUT"}',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    example: '2026-10-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    example: '2026-10-31T23:59:59.999Z',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista paginada de movimentações, da mais recente para a mais antiga',
    type: ListStockMovementsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Parâmetros de consulta inválidos',
  })
  async findMovements(
    @Query() query: ListStockMovementsQueryDto,
  ): Promise<ListStockMovementsResponseDto> {
    const filters = parseFiltersQuery(
      query.filters,
      ALLOWED_STOCK_MOVEMENT_FILTERS,
    ) as ListStockMovementsFiltersInputDto;

    for (const key of ['productId', 'createdBy']) {
      if (filters?.[key] !== undefined && !isUUID(filters[key])) {
        throw new BadRequestException(`filter ${key} must be a valid UUID`);
      }
    }

    if (
      filters?.movementType !== undefined &&
      !Object.values(StockMovementType).includes(filters.movementType)
    ) {
      throw new BadRequestException(
        `filter movementType must be one of: ${Object.values(StockMovementType).join(', ')}`,
      );
    }

    const startDate = query.startDate ? new Date(query.startDate) : undefined;
    const endDate = query.endDate ? new Date(query.endDate) : undefined;

    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException('startDate must be before endDate');
    }

    return this.listStockMovementsUseCase.execute({
      page: query.page,
      limit: query.limit,
      search: query.search,
      sort: parseSortQuery(query.sort, ALLOWED_STOCK_MOVEMENT_SORT_COLUMNS),
      filters,
      startDate,
      endDate,
    });
  }

  @Post('movements')
  @UseInterceptors(CurrentUserInterceptor)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registra uma movimentação de estoque' })
  @ApiBody({ type: CreateStockMovementRequestDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Movimentação registrada e estoque atualizado com sucesso',
    type: StockMovementResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Produto ou estoque do produto não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      'Saída maior que a quantidade disponível (quantidade - reservada) ou ajuste abaixo da quantidade reservada',
  })
  async createMovement(
    @Req() request: Request & { user: AccessTokenPayload },
    @Body() dto: CreateStockMovementRequestDto,
    @CurrentUser() currentUser: CurrentUserType,
  ): Promise<StockMovementResponseDto> {
    return this.createStockMovementUseCase.execute({
      ...dto,
      createdBy: request.user.sub,
      createdByUsername: currentUser?.username,
    });
  }
}
