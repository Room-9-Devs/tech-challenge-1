import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ListRolesUseCase } from '@/application/use-cases/permissions/list-roles.use-case';
import { ChangeRoleUseCase } from '@/application/use-cases/permissions/change-role.use-case';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ChangeRoleRequestDto } from './permissions.dto';

@ApiTags('Permissões')
@ApiBearerAuth('access-token')
@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class PermissionsController {
  constructor(
    private readonly listRolesUseCase: ListRolesUseCase,
    private readonly changeRoleUseCase: ChangeRoleUseCase,
  ) { }

  @Get('roles')
  @ApiOperation({ summary: 'Listar roles disponíveis' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Roles disponíveis para atribuição.' })
  async listRoles() {
    return this.listRolesUseCase.execute();
  }

  @Patch('users/:userId/role')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Alterar role de um usuário' })
  @ApiBody({ type: ChangeRoleRequestDto })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: 'Role alterado com sucesso.' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Usuário ou role não encontrado.' })
  async changeRole(@Param('userId') userId: string, @Body() dto: ChangeRoleRequestDto) {
    await this.changeRoleUseCase.execute(userId, dto.role);
  }
}
