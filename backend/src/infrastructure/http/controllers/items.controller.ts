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
import { CreateItemUseCase } from '@/application/use-cases/items/create-item/create-item.use-case';
import { ListItemsUseCase } from '@/application/use-cases/items/list-items/list-items.use-case';
import { UpdateItemUseCase } from '@/application/use-cases/items/update-item/update-item.use-case';
import { DeleteItemUseCase } from '@/application/use-cases/items/delete-item/delete-item.use-case';
import { CreateItemRequestDto } from '../dtos/create-item-request.dto';
import { UpdateItemRequestDto } from '../dtos/update-item-request.dto';
import { ItemResponseDto } from '../dtos/item-response.dto';
import { ListItemsResponseDto } from '../dtos/list-items-response.dto';

@ApiTags('Items')
@Controller('items')
export class ItemsController {
  constructor(
    private readonly createItemUseCase: CreateItemUseCase,
    private readonly listItemsUseCase: ListItemsUseCase,
    private readonly updateItemUseCase: UpdateItemUseCase,
    private readonly deleteItemUseCase: DeleteItemUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new item' })
  @ApiBody({ type: CreateItemRequestDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Item created successfully',
    type: ItemResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Item with this SKU already exists',
  })
  async create(@Body() dto: CreateItemRequestDto): Promise<ItemResponseDto> {
    return this.createItemUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all active items' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of items',
    type: ListItemsResponseDto,
  })
  async findAll(): Promise<ListItemsResponseDto> {
    return this.listItemsUseCase.execute();
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an item' })
  @ApiParam({
    name: 'id',
    description: 'Item UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateItemRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Item updated successfully',
    type: ItemResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Item not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Item with this SKU already exists',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateItemRequestDto,
  ): Promise<ItemResponseDto> {
    return this.updateItemUseCase.execute({ id, ...dto });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deactivate an item' })
  @ApiParam({
    name: 'id',
    description: 'Item UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Item deactivated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Item not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Item has stock and cannot be deactivated',
  })
  async delete(@Param('id') id: string): Promise<void> {
    return this.deleteItemUseCase.execute({ id });
  }
}
