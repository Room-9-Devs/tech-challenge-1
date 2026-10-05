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
import { CreateRepairUseCase } from '@/application/use-cases/repairs/create-repair/create-repair.use-case';
import { FindRepairUseCase } from '@/application/use-cases/repairs/find-repair/find-repair.use-case';
import { ListRepairsUseCase } from '@/application/use-cases/repairs/list-repairs/list-repairs.use-case';
import { UpdateRepairUseCase } from '@/application/use-cases/repairs/update-repair/update-repair.use-case';
import { DeleteRepairUseCase } from '@/application/use-cases/repairs/delete-repair/delete-repair.use-case';
import { CreateRepairRequestDto } from '../dtos/create-repair-request.dto';
import { UpdateRepairRequestDto } from '../dtos/update-repair-request.dto';
import { RepairResponseDto } from '../dtos/repair-response.dto';
import { ListRepairsResponseDto } from '../dtos/list-repairs-response.dto';

@ApiTags('Tipos de Reparo/Serviço')
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
  async create(
    @Body() dto: CreateRepairRequestDto,
  ): Promise<RepairResponseDto> {
    return this.createRepairUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os tipos de reparo/serviço' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de tipos de reparo/serviço',
    type: ListRepairsResponseDto,
  })
  async findAll(): Promise<ListRepairsResponseDto> {
    return this.listRepairsUseCase.execute();
  }

  @Get(':id')
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
  async findById(@Param('id') id: string): Promise<RepairResponseDto> {
    return this.findRepairUseCase.execute({ id });
  }

  @Put(':id')
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
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRepairRequestDto,
  ): Promise<RepairResponseDto> {
    return this.updateRepairUseCase.execute({ id, ...dto });
  }

  @Delete(':id')
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
  async delete(@Param('id') id: string): Promise<void> {
    return this.deleteRepairUseCase.execute({ id });
  }
}
