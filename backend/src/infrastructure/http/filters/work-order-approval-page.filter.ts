import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from '@/domain/errors/domain.error';
import { WorkOrderApprovalLinkInvalidError } from '@/domain/errors/work-order-approval-link-invalid.error';
import { HTML_PAGE_HEADERS } from '../pages/page-layout';
import {
  renderApprovalErrorPage,
  renderApprovalInvalidPage,
} from '../pages/work-order-approval.pages';

// O cliente abre essas rotas no navegador: qualquer erro vira página HTML, nunca JSON.
@Catch()
export class WorkOrderApprovalPageFilter implements ExceptionFilter {
  private readonly logger = new Logger(WorkOrderApprovalPageFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof WorkOrderApprovalLinkInvalidError) {
      this.send(response, exception.statusCode, renderApprovalInvalidPage());
      return;
    }

    const status = this.statusOf(exception);
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const failure =
        exception instanceof Error ? exception : new Error(String(exception));
      // Sem a URL na mensagem: ela contém o token.
      this.logger.error(
        `Falha ao processar aprovação de orçamento: ${failure.message}`,
        failure.stack,
      );
    }
    this.send(response, status, renderApprovalErrorPage());
  }

  private statusOf(exception: unknown): number {
    if (exception instanceof HttpException) return exception.getStatus();
    if (exception instanceof DomainError) return exception.statusCode;
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private send(response: Response, status: number, html: string): void {
    response.status(status).set(HTML_PAGE_HEADERS).send(html);
  }
}
