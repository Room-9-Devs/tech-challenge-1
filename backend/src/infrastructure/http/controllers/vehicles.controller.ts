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
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

import { CreateVehicleUseCase } from '@/application/use-cases/vehicles/create-vehicle/create-vehicle.use-case';
import { FindVehicleUseCase } from '@/application/use-cases/vehicles/find-vehicle/find-vehicle.use-case';
import { ListVehiclesUseCase } from '@/application/use-cases/vehicles/list-vehicles/list-vehicles.use-case';
import { UpdateVehicleUseCase } from '@/application/use-cases/vehicles/update-vehicle.use-case';
import { DeleteVehicleUseCase } from '@/application/use-cases/vehicles/delete-vehicle.use-case';
import { GetFipeDataUseCase } from '@/application/use-cases/vehicles/get-fipe-data.use-case';
import { FipePrice } from '@/application/ports/fipe.gateway';

import { CreateVehicleRequestDto } from '../dtos/create-vehicle-request.dto';
import { VehicleResponseDto } from '../dtos/vehicle-response.dto';
import { ListVehiclesResponseDto } from '../dtos/list-vehicles-response.dto';
import { UpdateVehicleRequestDto } from '../dtos/update-vehicle-request.dto';

@ApiTags('Vehicles')
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

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new vehicle' })
  @ApiBody({ type: CreateVehicleRequestDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Vehicle created successfully',
    type: VehicleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Vehicle with this license plate already exists',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vehicle owner not found',
  })
  async create(
    @Body() dto: CreateVehicleRequestDto,
  ): Promise<VehicleResponseDto> {
    return this.createVehicleUseCase.execute(dto);
  }

  @Get('fipe/:code')
  @ApiOperation({ summary: 'Get FIPE prices by FIPE code' })
  @ApiParam({ name: 'code', example: '001004-9' })
  @ApiResponse({ status: HttpStatus.OK, description: 'FIPE prices' })
  async getFipeData(@Param('code') code: string): Promise<FipePrice[]> {
    return this.getFipeDataUseCase.execute(code);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Replace vehicle details' })
  @ApiBody({ type: UpdateVehicleRequestDto })
  @ApiResponse({ status: HttpStatus.OK, type: VehicleResponseDto })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateVehicleRequestDto,
  ): Promise<VehicleResponseDto> {
    return this.updateVehicleUseCase.execute({ id, ...dto });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete vehicle' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT })
  async delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.deleteVehicleUseCase.execute(id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find vehicle by ID' })
  @ApiParam({
    name: 'id',
    description: 'Vehicle UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vehicle found',
    type: VehicleResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vehicle not found',
  })
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<VehicleResponseDto> {
    return this.findVehicleUseCase.execute({ id });
  }

  @Get()
  @ApiOperation({ summary: 'List all vehicles' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of vehicles',
    type: ListVehiclesResponseDto,
  })
  async findAll(): Promise<ListVehiclesResponseDto> {
    return this.listVehiclesUseCase.execute();
  }
}
