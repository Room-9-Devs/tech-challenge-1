import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
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
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { CreateProductUseCase } from '@/application/use-cases/products/create-product/create-product.use-case';
import { ListProductsUseCase } from '@/application/use-cases/products/list-products/list-products.use-case';
import { FindProductUseCase } from '@/application/use-cases/products/find-product/find-product.use-case';
import { UpdateProductUseCase } from '@/application/use-cases/products/update-product/update-product.use-case';
import { DeleteProductUseCase } from '@/application/use-cases/products/delete-product/delete-product.use-case';
import { ActivateProductUseCase } from '@/application/use-cases/products/activate-product/activate-product.use-case';
import { ProductType, ProductUnit } from '@/domain/entities/product.entity';
import { CreateProductRequestDto } from '../dtos/create-product-request.dto';
import { UpdateProductRequestDto } from '../dtos/update-product-request.dto';
import { ProductResponseDto } from '../dtos/product-response.dto';
import { ListProductsQueryDto } from '../dtos/list-products-query.dto';
import { ListProductsFiltersInputDto } from '@/application/use-cases/products/list-products/list-products-input.dto';
import { ListProductsResponseDto } from '../dtos/list-products-response.dto';
import { parseFiltersQuery } from '@/shared/pagination/parse-filters-query';
import { parseSortQuery } from '@/shared/pagination/parse-sort-query';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentUserInterceptor } from '../auth/current-user.interceptor';
import { CurrentUser as CurrentUserType } from '@/application/use-cases/users/current-user.dto';
import {
  HateoasCollection,
  HateoasItem,
} from '../hateoas/hateoas.decorator';
import { productLinks } from '../hateoas/resources/product.links';

const ALLOWED_PRODUCT_SORT_COLUMNS = [
  'name',
  'description',
  'sku',
  'productType',
  'unit',
  'cost',
  'salePrice',
  'createdAt',
  'updatedAt',
];

const ALLOWED_PRODUCT_FILTERS = ['sku', 'name', 'productType', 'unit'];

const PRODUCT_FILTER_ENUMS: Record<string, string[]> = {
  productType: Object.values(ProductType),
  unit: Object.values(ProductUnit),
};

function validateProductFilters(filters: ListProductsFiltersInputDto | undefined): void {
  for (const [key, value] of Object.entries(filters ?? {})) {
    if (typeof value !== 'string') {
      throw new BadRequestException(`O filtro ${key} deve ser um texto`);
    }

    const allowedValues = PRODUCT_FILTER_ENUMS[key];
    if (allowedValues && !allowedValues.includes(value)) {
      throw new BadRequestException(
        `O filtro ${key} deve ser um destes valores: ${allowedValues.join(', ')}`,
      );
    }
  }
}

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
    private readonly findProductUseCase: FindProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
    private readonly activateProductUseCase: ActivateProductUseCase,
  ) {}

  @Post()
  @UseInterceptors(CurrentUserInterceptor)
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
  @HateoasItem(productLinks)
  async create(
    @Body() dto: CreateProductRequestDto,
    @CurrentUser() currentUser: CurrentUserType,
  ): Promise<ProductResponseDto> {
    return this.createProductUseCase.execute({ ...dto, createdBy: currentUser?.username });
  }

  @Get()
  @ApiOperation({ summary: 'Lista produtos com paginação, busca e filtros' })
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
    description: 'JSON de filtros. Ex: {"productType":"PART"}',
    example: '{"productType":"PART"}',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista paginada de produtos',
    type: ListProductsResponseDto,
  })
  @HateoasCollection(productLinks)
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Ordenação ou filtros inválidos',
  })
  async findAll(
    @Query() query: ListProductsQueryDto,
  ): Promise<ListProductsResponseDto> {
    const filters = parseFiltersQuery(
      query.filters,
      ALLOWED_PRODUCT_FILTERS,
    ) as ListProductsFiltersInputDto;

    validateProductFilters(filters);

    return this.listProductsUseCase.execute({
      page: query.page,
      limit: query.limit,
      search: query.search,
      sort: parseSortQuery(query.sort, ALLOWED_PRODUCT_SORT_COLUMNS),
      filters,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca produto pelo ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID do produto',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Produto encontrado',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'ID não é um UUID válido',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Produto não encontrado',
  })
  @HateoasItem(productLinks)
  async findById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ProductResponseDto> {
    return this.findProductUseCase.execute({ id });
  }

  @Put(':id')
  @UseInterceptors(CurrentUserInterceptor)
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
    description:
      'Já existe um produto com este SKU, ou o produto tem estoque e a unidade ou o tipo foram alterados',
  })
  @HateoasItem(productLinks)
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductRequestDto,
    @CurrentUser() currentUser: CurrentUserType,
  ): Promise<ProductResponseDto> {
    return this.updateProductUseCase.execute({ id, ...dto, createdBy: currentUser?.username });
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
  async delete(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.deleteProductUseCase.execute({ id });
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Reativa um produto desativado' })
  @ApiParam({
    name: 'id',
    description: 'UUID do produto',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Produto reativado com sucesso',
    type: ProductResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'ID não é um UUID válido',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Produto não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Produto já está ativo',
  })
  async activate(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<ProductResponseDto> {
    return this.activateProductUseCase.execute({ id });
  }
}
