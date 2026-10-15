import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseFilters,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetWorkOrderApprovalUseCase } from '@/application/use-cases/work-order-approvals/get-work-order-approval/get-work-order-approval.use-case';
import { DecideWorkOrderApprovalUseCase } from '@/application/use-cases/work-order-approvals/decide-work-order-approval/decide-work-order-approval.use-case';
import {
  WorkOrderApprovalDecision,
  isWorkOrderApprovalDecision,
} from '@/application/use-cases/work-order-approvals/work-order-approval-decision.enum';
import { WorkOrderApprovalLinkInvalidError } from '@/domain/errors/work-order-approval-link-invalid.error';
import { DecideWorkOrderApprovalRequestDto } from '../dtos/decide-work-order-approval-request.dto';
import { WorkOrderApprovalPageFilter } from '../filters/work-order-approval-page.filter';
import { HtmlPage } from '../pages/page-layout';
import {
  renderApprovalConfirmPage,
  renderApprovalResultPage,
} from '../pages/work-order-approval.pages';

// Token opaco em base64url; rejeita lixo antes de calcular hash e consultar o banco.
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{32,128}$/;

const tokenParam = ApiParam({
  name: 'token',
  description: 'Token de aprovação enviado no e-mail do orçamento',
});
const decisionParam = ApiParam({
  name: 'decision',
  enum: WorkOrderApprovalDecision,
  description:
    'Decisão do cliente: approve aprova, reject recusa (cancela a OS)',
});

// Sem JwtAuthGuard: o token do link é a credencial e só vale para a OS e o cliente a que pertence.
@ApiTags('Aprovação de Orçamento')
@Controller('work-order-approvals')
@UseFilters(WorkOrderApprovalPageFilter)
export class WorkOrderApprovalsController {
  constructor(
    private readonly getWorkOrderApproval: GetWorkOrderApprovalUseCase,
    private readonly decideWorkOrderApproval: DecideWorkOrderApprovalUseCase,
  ) {}

  @Get(':token/:decision')
  @HtmlPage()
  @ApiOperation({
    summary: 'Página de confirmação aberta pelo link do e-mail',
    description:
      'Só exibe o orçamento e o botão de confirmação. Não altera a OS, pois filtros de e-mail abrem os links automaticamente.',
  })
  @tokenParam
  @decisionParam
  @ApiProduces('text/html')
  @ApiResponse({ status: HttpStatus.OK, description: 'Página de confirmação' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Link inválido, expirado, já usado ou OS fora de aprovação',
  })
  async show(
    @Param('token') token: string,
    @Param('decision') decision: string,
  ): Promise<string> {
    const validDecision = this.parse(token, decision);
    const quote = await this.getWorkOrderApproval.execute(token);
    return renderApprovalConfirmPage(quote, validDecision);
  }

  @Post(':token/:decision')
  @HttpCode(HttpStatus.OK)
  @HtmlPage()
  @ApiOperation({
    summary: 'Registra a aprovação ou a recusa do orçamento',
    description:
      'Enviado pelo formulário da página de confirmação. Aprovar muda a OS para approved; recusar muda para cancelled.',
  })
  @tokenParam
  @decisionParam
  @ApiConsumes('application/x-www-form-urlencoded', 'application/json')
  @ApiBody({ type: DecideWorkOrderApprovalRequestDto, required: false })
  @ApiProduces('text/html')
  @ApiResponse({ status: HttpStatus.OK, description: 'Resposta registrada' })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Link inválido, expirado, já usado ou OS fora de aprovação',
  })
  async decide(
    @Param('token') token: string,
    @Param('decision') decision: string,
    @Body() body: DecideWorkOrderApprovalRequestDto,
  ): Promise<string> {
    const result = await this.decideWorkOrderApproval.execute({
      token,
      decision: this.parse(token, decision),
      reason: body?.reason,
    });
    return renderApprovalResultPage(result);
  }

  private parse(token: string, decision: string): WorkOrderApprovalDecision {
    if (!TOKEN_PATTERN.test(token) || !isWorkOrderApprovalDecision(decision)) {
      throw new WorkOrderApprovalLinkInvalidError();
    }
    return decision;
  }
}
