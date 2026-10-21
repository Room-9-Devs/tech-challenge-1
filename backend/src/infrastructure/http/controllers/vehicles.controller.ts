import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentUserInterceptor } from '../auth/current-user.interceptor';
import { CurrentUser as CurrentUserType } from '@/application/use-cases/users/current-user.dto';

import { CreateVehicleUseCase } from '@/application/use-cases/vehicles/create-vehicle/create-vehicle.use-case';
import { FindVehicleUseCase } from '@/application/use-cases/vehicles/find-vehicle/find-vehicle.use-case';
import { ListVehiclesUseCase } from '@/application/use-cases/vehicles/list-vehicles/list-vehicles.use-case';
import { UpdateVehicleUseCase } from '@/application/use-cases/vehicles/update-vehicle.use-case';
import { DeleteVehicleUseCase } from '@/application/use-cases/vehicles/delete-vehicle.use-case';
import { GetFipeDataUseCase } from '@/application/use-cases/vehicles/get-fipe-data.use-case';
import { FipePrice } from '@/application/ports/fipe.gateway';
import { BadRequestException } from '@nestjs/common';
import { isUUID } from 'class-validator';

import { CreateVehicleRequestDto } from '../dtos/create-vehicle-request.dto';
import { VehicleResponseDto } from '../dtos/vehicle-response.dto';
import { ListVehiclesResponseDto } from '../dtos/list-vehicles-response.dto';
import { ListVehiclesQueryDto } from '../dtos/list-vehicles-query.dto';
import { UpdateVehicleRequestDto } from '../dtos/update-vehicle-request.dto';
import { ListVehiclesFiltersInputDto } from '@/application/use-cases/vehicles/list-vehicles/list-vehicles-input.dto';
import { parseFiltersQuery } from '@/shared/pagination/parse-filters-query';
import { parseSortQuery } from '@/shared/pagination/parse-sort-query';
import {
  HateoasCollection,
  HateoasItem,
} from '../hateoas/hateoas.decorator';
import { vehicleLinks } from '../hateoas/resources/vehicle.links';

const ALLOWED_VEHICLE_SORT_COLUMNS = [
  'licensePlate',
  'model',
  'brand',
  'year',
  'color',
  'createdAt',
  'updatedAt',
];

const ALLOWED_VEHICLE_FILTERS = ['brand', 'model', 'year', 'color', 'userId'];

@ApiTags('Veículos')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'staff')
@Controller('vehicles')
export class VehiclesController {
  constructor(
    private readonly createVehicleUseCase: CreateVehicleUseCase,
    private readonly findVehicleUseCase: FindVehicleUseCase,
    private readonly listVehiclesUseCase: ListVehiclesUseCase,
    private readonly updateVehicleUseCase: UpdateVehicleUseCase,
    private readonly deleteVehicleUseCase: DeleteVehicleUseCase,
    private readonly getFipeDataUseCase: GetFipeDataUseCase,
  ) {}

  @Post(':user_id')
  @UseInterceptors(CurrentUserInterceptor)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastra um veículo vinculado ao usuário dono' })
  @ApiParam({
    name: 'user_id',
    description: 'UUID do usuário dono do veículo',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: CreateVehicleRequestDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Veículo cadastrado com sucesso',
    type: VehicleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados de entrada inválidos, como placa fora dos formatos aceitos',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe um veículo com esta placa',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Dono do veículo não encontrado',
  })
  @HateoasItem(vehicleLinks)
  async create(
    @Param('user_id', new ParseUUIDPipe()) user_id: string,
    @Body() dto: CreateVehicleRequestDto,
    @CurrentUser() currentUser: CurrentUserType,
  ): Promise<VehicleResponseDto> {
    return this.createVehicleUseCase.execute({
      user_id,
      ...dto,
      createdBy: currentUser?.username,
    });
  }

  @Get('fipe/:code')
  @ApiOperation({ summary: 'Consulta os preços da tabela FIPE pelo código FIPE' })
  @ApiParam({ name: 'code', description: 'Código FIPE do veículo', example: '001004-9' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Preços FIPE do veículo' })
  async getFipeData(@Param('code') code: string): Promise<FipePrice[]> {
    return this.getFipeDataUseCase.execute(code);
  }

  @Put(':id')
  @UseInterceptors(CurrentUserInterceptor)
  @ApiOperation({ summary: 'Atualiza os dados do veículo (o dono não muda)' })
  @ApiParam({
    name: 'id',
    description: 'UUID do veículo',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateVehicleRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Veículo atualizado com sucesso',
    type: VehicleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'ID não é um UUID válido ou dados de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Veículo não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe outro veículo com esta placa',
  })
  @HateoasItem(vehicleLinks)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateVehicleRequestDto,
    @CurrentUser() currentUser: CurrentUserType,
  ): Promise<VehicleResponseDto> {
    return this.updateVehicleUseCase.execute({ id, ...dto, createdBy: currentUser?.username });
  }

  @Delete(':id')
  @UseInterceptors(CurrentUserInterceptor)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Exclui um veículo' })
  @ApiParam({
    name: 'id',
    description: 'UUID do veículo',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Veículo excluído com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'ID não é um UUID válido',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Veículo não encontrado',
  })
  async delete(
    @Param('id', new ParseUUIDPipe()) id: string,
    @CurrentUser() currentUser: CurrentUserType,
  ): Promise<void> {
    await this.deleteVehicleUseCase.execute(id, currentUser?.username);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca veículo pelo ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID do veículo',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Veículo encontrado',
    type: VehicleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Veículo não encontrado',
  })
  @HateoasItem(vehicleLinks)
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<VehicleResponseDto> {
    return this.findVehicleUseCase.execute({ id });
  }

  @Get()
  @ApiOperation({ summary: 'Lista veículos com paginação, busca e filtros' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Busca por placa (com ou sem hífen), modelo, marca ou cor',
    example: 'Corolla',
  })
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
      'JSON de filtros por brand, model, year, color e/ou userId (UUID do dono, para listar os veículos de um cliente). Ex: {"userId":"550e8400-e29b-41d4-a716-446655440000"}',
    example: '{"brand":"Toyota"}',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista paginada de veículos',
    type: ListVehiclesResponseDto,
  })
  @HateoasCollection(vehicleLinks)
  async findAll(
    @Query() query: ListVehiclesQueryDto,
  ): Promise<ListVehiclesResponseDto> {
    return this.listVehiclesUseCase.execute({
      page: query.page,
      limit: query.limit,
      search: query.search,
    sort: parseSortQuery(query.sort, ALLOWED_VEHICLE_SORT_COLUMNS),
      filters: this.validateVehicleFilters(
        parseFiltersQuery(query.filters, ALLOWED_VEHICLE_FILTERS),
      ),
    });
  }

  private validateVehicleFilters(
    filters: Record<string, unknown> | undefined,
  ): ListVehiclesFiltersInputDto | undefined {
    if (!filters) return undefined;
    if (filters.userId !== undefined && !isUUID(filters.userId)) {
      throw new BadRequestException('O filtro userId deve ser um UUID válido');
    }
    if (filters.year !== undefined && !Number.isInteger(Number(filters.year))) {
      throw new BadRequestException('O filtro year deve ser um número inteiro');
    }
    return filters as ListVehiclesFiltersInputDto;
  }
}
