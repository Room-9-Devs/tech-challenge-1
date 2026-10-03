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
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateProductUseCase } from '@/application/use-cases/products/create-product/create-product.use-case';
import { ListProductsUseCase } from '@/application/use-cases/products/list-products/list-products.use-case';
import { UpdateProductUseCase } from '@/application/use-cases/products/update-product/update-product.use-case';
import { DeleteProductUseCase } from '@/application/use-cases/products/delete-product/delete-product.use-case';
import { CreateProductRequestDto } from '../dtos/create-product-request.dto';
import { UpdateProductRequestDto } from '../dtos/update-product-request.dto';
import { ProductResponseDto } from '../dtos/product-response.dto';
import { ListProductsResponseDto } from '../dtos/list-products-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@ApiTags('Produtos')
@ApiBearerAuth('access-token')
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'staff')
@ApiResponse({
  status: HttpStatus.UNAUTHORIZED,
  description: 'Autenticação obrigatória',
})
@ApiResponse({
  status: HttpStatus.FORBIDDEN,
  description: 'Usuário sem permissão para gerenciar produtos',
})
export class ProductsController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cria um novo produto' })
  @ApiBody({ type: CreateProductRequestDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Produto criado com sucesso',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe um produto com este SKU',
  })
  async create(
    @Body() dto: CreateProductRequestDto,
  ): Promise<ProductResponseDto> {
    return this.createProductUseCase.execute(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lista todos os produtos ativos' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de produtos',
    type: ListProductsResponseDto,
  })
  async findAll(): Promise<ListProductsResponseDto> {
    return this.listProductsUseCase.execute();
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualiza um produto' })
  @ApiParam({
    name: 'id',
    description: 'UUID do produto',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: UpdateProductRequestDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Produto atualizado com sucesso',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Produto não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe um produto com este SKU',
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductRequestDto,
  ): Promise<ProductResponseDto> {
    return this.updateProductUseCase.execute({ id, ...dto });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desativa um produto' })
  @ApiParam({
    name: 'id',
    description: 'UUID do produto',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Produto desativado com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Produto não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Produto possui estoque e não pode ser desativado',
  })
  async delete(@Param('id') id: string): Promise<void> {
    return this.deleteProductUseCase.execute({ id });
  }
}
