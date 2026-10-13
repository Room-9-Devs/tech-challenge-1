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
import { CurrentUser as CurrentUserType } from '../auth/current-user.type';
import { CreateRepairUseCase } from '@/application/use-cases/repairs/create-repair/create-repair.use-case';
import { FindRepairUseCase } from '@/application/use-cases/repairs/find-repair/find-repair.use-case';
import { ListRepairsUseCase } from '@/application/use-cases/repairs/list-repairs/list-repairs.use-case';
import { UpdateRepairUseCase } from '@/application/use-cases/repairs/update-repair/update-repair.use-case';
import { DeleteRepairUseCase } from '@/application/use-cases/repairs/delete-repair/delete-repair.use-case';
import { CreateRepairRequestDto } from '../dtos/create-repair-request.dto';
import { UpdateRepairRequestDto } from '../dtos/update-repair-request.dto';
import { RepairResponseDto } from '../dtos/repair-response.dto';
import { ListRepairsQueryDto } from '../dtos/list-repairs-query.dto';
import { ListRepairsFiltersInputDto } from '@/application/use-cases/repairs/list-repairs/list-repairs-input.dto';
import { ListRepairsResponseDto } from '../dtos/list-repairs-response.dto';
import { parseFiltersQuery } from '@/shared/pagination/parse-filters-query';
import { parseSortQuery } from '@/shared/pagination/parse-sort-query';
import {
  HateoasCollection,
  HateoasItem,
} from '../hateoas/hateoas.decorator';
import { repairLinks } from '../hateoas/resources/repair.links';

const ALLOWED_REPAIR_SORT_COLUMNS = [
  'description',
  'unitValue',
  'createdAt',
  'updatedAt',
];

const ALLOWED_REPAIR_FILTERS = ['description', 'unitValue'];

@ApiTags('Tipos de Reparo/Serviço')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'staff')
@Controller('repairs')
export class RepairsController {
  constructor(
    private readonly createRepairUseCase: CreateRepairUseCase,
    private readonly findRepairUseCase: FindRepairUseCase,
    private readonly listRepairsUseCase: ListRepairsUseCase,
    private readonly updateRepairUseCase: UpdateRepairUseCase,
    private readonly deleteRepairUseCase: DeleteRepairUseCase,
  ) {}

  @Post()
  @UseInterceptors(CurrentUserInterceptor)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria um novo tipo de reparo/serviço' })
  @ApiBody({ type: CreateRepairRequestDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tipo de reparo/serviço criado com sucesso',
    type: RepairResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe um tipo de reparo/serviço com esta descrição',
  })
  @HateoasItem(repairLinks)
  async create(
    @Body() dto: CreateRepairRequestDto,
    @CurrentUser() currentUser: CurrentUserType,
  ): Promise<RepairResponseDto> {
    return this.createRepairUseCase.execute({ ...dto, createdBy: currentUser?.username });
  }

  @Get()
  @Roles('admin', 'staff', 'client')
  @ApiOperation({ summary: 'Lista tipos de reparo/serviço com paginação, busca e filtros' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'troca de óleo' })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    description: 'JSON de ordenação. Ex: [{"field":"description","order":"asc"}]',
    example: '[{"field":"description","order":"asc"}]',
  })
  @ApiQuery({
    name: 'filters',
    required: false,
    type: String,
    description: 'JSON de filtros. Ex: {"unitValue":120}',
    example: '{"unitValue":120}',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista paginada de tipos de reparo/serviço',
    type: ListRepairsResponseDto,
  })
  @HateoasCollection(repairLinks)
  async findAll(
    @Query() query: ListRepairsQueryDto,
  ): Promise<ListRepairsResponseDto> {
    return this.listRepairsUseCase.execute({
      page: query.page,
      limit: query.limit,
      search: query.search,
      sort: parseSortQuery(query.sort, ALLOWED_REPAIR_SORT_COLUMNS),
      filters: parseFiltersQuery(
        query.filters,
        ALLOWED_REPAIR_FILTERS,
      ) as ListRepairsFiltersInputDto,
    });
  }

  @Get(':id')
  @Roles('admin', 'staff', 'client')
  @ApiOperation({ summary: 'Busca tipo de reparo/serviço pelo ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID do tipo de reparo/serviço',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tipo de reparo/serviço encontrado',
    type: RepairResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tipo de reparo/serviço não encontrado',
  })
  @HateoasItem(repairLinks)
  async findById(@Param('id') id: string): Promise<RepairResponseDto> {
    return this.findRepairUseCase.execute({ id });
  }

  @Put(':id')
  @UseInterceptors(CurrentUserInterceptor)
  @ApiOperation({ summary: 'Atualiza um tipo de reparo/serviço' })
  @ApiParam({
    name: 'id',
    description: 'UUID do tipo de reparo/serviço',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateRepairRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tipo de reparo/serviço atualizado com sucesso',
    type: RepairResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tipo de reparo/serviço não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe um tipo de reparo/serviço com esta descrição',
  })
  @HateoasItem(repairLinks)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRepairRequestDto,
    @CurrentUser() currentUser: CurrentUserType,
  ): Promise<RepairResponseDto> {
    return this.updateRepairUseCase.execute({ id, ...dto, createdBy: currentUser?.username });
  }

  @Delete(':id')
  @UseInterceptors(CurrentUserInterceptor)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um tipo de reparo/serviço' })
  @ApiParam({
    name: 'id',
    description: 'UUID do tipo de reparo/serviço',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Tipo de reparo/serviço removido com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tipo de reparo/serviço não encontrado',
  })
  async delete(
    @Param('id') id: string,
    @CurrentUser() currentUser: CurrentUserType,
  ): Promise<void> {
    return this.deleteRepairUseCase.execute({ id, createdBy: currentUser?.username });
  }
}
