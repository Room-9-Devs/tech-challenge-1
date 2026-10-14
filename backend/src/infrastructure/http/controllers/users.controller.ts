import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateUserUseCase } from '@/application/use-cases/users/create-user/create-user.use-case';
import { FindUserUseCase } from '@/application/use-cases/users/find-user/find-user.use-case';
import { ListUsersUseCase } from '@/application/use-cases/users/list-users/list-users.use-case';
import { CreateUserRequestDto } from '../dtos/create-user-request.dto';
import { UserResponseDto } from '../dtos/user-response.dto';
import { ListUsersResponseDto } from '../dtos/list-users-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { CurrentUserInterceptor } from '../auth/current-user.interceptor';
import { CurrentUser as CurrentUserType } from '../auth/current-user.type';
import { ListUsersFiltersInputDto } from '@/application/use-cases/users/list-users/list-users-input.dto';
import { ListUsersQueryDto } from '../dtos/list-users-query.dto';
import { parseFiltersQuery } from '@/shared/pagination/parse-filters-query';
import { parseSortQuery } from '@/shared/pagination/parse-sort-query';

const ALLOWED_USERS_SORT_COLUMNS = [
  'username',
  'email',
  'profile.name',
  'role.name',
  'entityType',
  'createdAt',
  'updatedAt',
];

const ALLOWED_USERS_FILTERS = [
  'username',
  'email',
  'entityType',
  'entityId',
  'role',
  'profile',
  'profile.name',
];

@ApiTags('Usuários')
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly findUserUseCase: FindUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
  ) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @UseInterceptors(CurrentUserInterceptor)
  @ApiBearerAuth('access-token')
  @Roles('admin', 'staff')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Cadastrar usuário' })
  @ApiBody({ type: CreateUserRequestDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Usuário cadastrado com sucesso',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados de entrada inválidos',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Já existe um usuário com este e-mail',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Usuário não autorizado a cadastrar usuários',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Acesso negado para registrar funcionários',
  })
  async create(
    @Body() dto: CreateUserRequestDto,
    @CurrentUser() currentUser: CurrentUserType,
  ): Promise<UserResponseDto> {

    if (!currentUser) throw new UnauthorizedException();

    if (dto.entityType === 'employee' && currentUser.role === 'staff') throw new ForbiddenException('Funcionário não tem permissão para registrar outro funcionário.');

    return this.createUserUseCase.execute({ ...dto, createdBy: currentUser.username });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Dados do usuário logado' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dados do usuário logado',
    type: UserResponseDto,
  })
  async me(@Req() request: { user: { sub: string } }): Promise<UserResponseDto> {
    return this.findUserUseCase.execute({ id: request.user.sub });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Consultar usuário por ID' })
  @ApiParam({
    name: 'id',
    description: 'User UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Usuário encontrado',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Usuário não encontrado',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Usuário não autorizado a ver dados de outro usuário'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Usuário não autorizado a ver dados de outro usuário'
  })
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.findUserUseCase.execute({ id });
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth('access-token')
  @Roles('admin', 'staff')
  @ApiOperation({ summary: 'Listar usuários' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lista de usuários',
    type: ListUsersResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Usuário não autorizado a listar usuários'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Usuário não autorizado a listar usuários'
  })
  async findAll(
    @Query() query: ListUsersQueryDto): Promise<ListUsersResponseDto> {
    return this.listUsersUseCase.execute({
      page: query.page,
      limit: query.limit,
      search: query.search,
      sort: parseSortQuery(query.sort, ALLOWED_USERS_SORT_COLUMNS),
      filters: parseFiltersQuery(
        query.filters,
        ALLOWED_USERS_FILTERS,
      ) as ListUsersFiltersInputDto,
    });
  }
}