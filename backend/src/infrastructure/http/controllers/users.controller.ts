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
  BadRequestException,
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

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly findUserUseCase: FindUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
  ) { }

  @Post()
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
  async create(@Body() dto: CreateUserRequestDto): Promise<UserResponseDto> {
    if (dto.entityType !== 'client') throw new BadRequestException('Employee registration requires administrator access');
    return this.createUserUseCase.execute(dto);
  }

  // @Post('employees')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('admin')
  // @HttpCode(HttpStatus.CREATED)
  // async createEmployee(@Body() dto: CreateUserRequestDto): Promise<UserResponseDto> {
  //   if (dto.entityType !== 'employee') throw new BadRequestException('This endpoint only creates employees');
  //   return this.createUserUseCase.execute(dto);
  // }

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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
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
  async findAll(@Query('type') type?: 'client' | 'employee'): Promise<ListUsersResponseDto> {
    return this.listUsersUseCase.execute({ entityType: type });
  }
}
