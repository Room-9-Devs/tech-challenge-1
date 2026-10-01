import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { CreateServiceTypeUseCase } from '@/application/use-cases/service-types/create-service-type/create-service-type.use-case';
import { FindServiceTypeUseCase } from '@/application/use-cases/service-types/find-service-type/find-service-type.use-case';
import { ListServiceTypesUseCase } from '@/application/use-cases/service-types/list-service-types/list-service-types.use-case';
import { UpdateServiceTypeUseCase } from '@/application/use-cases/service-types/update-service-type/update-service-type.use-case';
import { DeleteServiceTypeUseCase } from '@/application/use-cases/service-types/delete-service-type/delete-service-type.use-case';
import { CreateServiceTypeRequestDto } from '../dtos/create-service-type-request.dto';
import { UpdateServiceTypeRequestDto } from '../dtos/update-service-type-request.dto';
import { ServiceTypeResponseDto } from '../dtos/service-type-response.dto';
import { ListServiceTypesResponseDto } from '../dtos/list-service-types-response.dto';

@ApiTags('Tipos de serviço')
@Controller('service-types')
export class ServiceTypesController {
  constructor(
    private readonly createServiceTypeUseCase: CreateServiceTypeUseCase,
    private readonly findServiceTypeUseCase: FindServiceTypeUseCase,
    private readonly listServiceTypesUseCase: ListServiceTypesUseCase,
    private readonly updateServiceTypeUseCase: UpdateServiceTypeUseCase,
    private readonly deleteServiceTypeUseCase: DeleteServiceTypeUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastrar tipo de serviço' })
  @ApiBody({ type: CreateServiceTypeRequestDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tipo de serviço cadastrado com sucesso',
    type: ServiceTypeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe um tipo de serviço com esta descrição',
  })
  async create(
    @Body() dto: CreateServiceTypeRequestDto,
  ): Promise<ServiceTypeResponseDto> {
    return this.createServiceTypeUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tipos de serviço' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de tipos de serviço',
    type: ListServiceTypesResponseDto,
  })
  async findAll(): Promise<ListServiceTypesResponseDto> {
    return this.listServiceTypesUseCase.execute();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Consultar tipo de serviço por ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID do tipo de serviço',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tipo de serviço encontrado',
    type: ServiceTypeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tipo de serviço não encontrado',
  })
  async findById(@Param('id') id: string): Promise<ServiceTypeResponseDto> {
    return this.findServiceTypeUseCase.execute({ id });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar tipo de serviço' })
  @ApiParam({
    name: 'id',
    description: 'Service type UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateServiceTypeRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tipo de serviço atualizado com sucesso',
    type: ServiceTypeResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service type not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe um tipo de serviço com esta descrição',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateServiceTypeRequestDto,
  ): Promise<ServiceTypeResponseDto> {
    return this.updateServiceTypeUseCase.execute({ id, ...dto });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Excluir tipo de serviço' })
  @ApiParam({
    name: 'id',
    description: 'Service type UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Tipo de serviço excluído com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Service type not found',
  })
  async delete(@Param('id') id: string): Promise<void> {
    return this.deleteServiceTypeUseCase.execute({ id });
  }
}
