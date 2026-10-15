import { BadRequestException, HttpStatus, Logger } from '@nestjs/common';
import {
  EXCEPTION_FILTERS_METADATA,
  GUARDS_METADATA,
} from '@nestjs/common/constants';
import { WorkOrderApprovalDecision } from '@/application/use-cases/work-order-approvals/work-order-approval-decision.enum';
import { WorkOrderApprovalLinkInvalidError } from '@/domain/errors/work-order-approval-link-invalid.error';
import { WorkOrderApprovalsController } from '@/infrastructure/http/controllers/work-order-approvals.controller';
import { WorkOrderApprovalPageFilter } from '@/infrastructure/http/filters/work-order-approval-page.filter';

describe('WorkOrderApprovalsController', () => {
  const token = 'a'.repeat(64);
  const quote = {
    customerName: 'Maria <b>Silva</b>',
    vehicle: 'Fiat Uno - ABC1D23',
    orderNumber: 'OS-0042/2026',
    items: [
      {
        description: 'Alinhamento',
        quantity: 1,
        unitPrice: 150,
        subtotal: 150,
      },
      {
        description: 'Óleo 5W30',
        quantity: 4,
        unitPrice: 54.9,
        subtotal: 219.6,
      },
    ],
    total: 369.6,
    generatedAt: new Date('2026-10-06T12:00:00Z'),
  };
  let getApproval: any;
  let decideApproval: any;
  let controller: WorkOrderApprovalsController;

  beforeEach(() => {
    getApproval = { execute: jest.fn().mockResolvedValue(quote) };
    decideApproval = {
      execute: jest.fn(async ({ decision }) => ({
        orderNumber: 'OS-0042/2026',
        decision,
      })),
    };
    controller = new WorkOrderApprovalsController(getApproval, decideApproval);
  });

  it('is public and renders errors as html pages', () => {
    expect(
      Reflect.getMetadata(GUARDS_METADATA, WorkOrderApprovalsController),
    ).toBeUndefined();
    expect(
      Reflect.getMetadata(
        EXCEPTION_FILTERS_METADATA,
        WorkOrderApprovalsController,
      ),
    ).toEqual([WorkOrderApprovalPageFilter]);
  });

  it('renders the approval confirmation form without deciding anything', async () => {
    const html = await controller.show(token, 'approve');

    expect(getApproval.execute).toHaveBeenCalledWith(token);
    expect(decideApproval.execute).not.toHaveBeenCalled();
    expect(html).toContain('<form method="POST">');
    expect(html).toContain('src="data:image/png;base64,');
    expect(html).toContain('CONFIRMAR APROVAÇÃO');
    expect(html).toContain('href="./reject"');
    expect(html).toContain('Alinhamento');
    expect(html).toContain('VALOR UNIT.');
    expect(html).toContain('54,90');
    expect(html).toContain('219,60');
    expect(html).toContain('369,60');
    expect(html).toContain('Maria &lt;b&gt;Silva&lt;/b&gt;');
    expect(html).not.toContain('<script');
  });

  it('renders the rejection form with an optional reason', async () => {
    const html = await controller.show(token, 'reject');

    expect(html).toContain('name="reason"');
    expect(html).toContain('maxlength="500"');
    expect(html).toContain('CONFIRMAR RECUSA');
    expect(html).toContain('href="./approve"');
  });

  it('records the decision and renders the result page', async () => {
    const html = await controller.decide(token, 'reject', {
      reason: 'Muito caro',
    });

    expect(decideApproval.execute).toHaveBeenCalledWith({
      token,
      decision: WorkOrderApprovalDecision.REJECT,
      reason: 'Muito caro',
    });
    expect(html).toContain('Orçamento recusado');
  });

  it('renders the approved result page', async () => {
    const html = await controller.decide(token, 'approve', {});

    expect(html).toContain('Orçamento aprovado');
  });

  it.each([
    ['an unknown decision', token, 'maybe'],
    ['a malformed token', 'short', 'approve'],
    ['a token with invalid characters', `${'a'.repeat(40)}<x>`, 'approve'],
  ])(
    'rejects %s before reaching the use cases',
    async (_label, value, decision) => {
      await expect(controller.show(value, decision)).rejects.toBeInstanceOf(
        WorkOrderApprovalLinkInvalidError,
      );
      await expect(
        controller.decide(value, decision, {}),
      ).rejects.toBeInstanceOf(WorkOrderApprovalLinkInvalidError);
      expect(getApproval.execute).not.toHaveBeenCalled();
      expect(decideApproval.execute).not.toHaveBeenCalled();
    },
  );
});

describe('WorkOrderApprovalPageFilter', () => {
  function hostWith(response: any) {
    return {
      switchToHttp: () => ({ getResponse: () => response }),
    } as any;
  }

  function fakeResponse() {
    const response: any = {};
    response.status = jest.fn(() => response);
    response.set = jest.fn(() => response);
    response.send = jest.fn(() => response);
    return response;
  }

  it('renders the invalid link page with security headers', () => {
    const response = fakeResponse();

    new WorkOrderApprovalPageFilter().catch(
      new WorkOrderApprovalLinkInvalidError(),
      hostWith(response),
    );

    expect(response.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(response.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Type': 'text/html; charset=utf-8',
        'Referrer-Policy': 'no-referrer',
        'Cache-Control': 'no-store',
      }),
    );
    expect(response.send.mock.calls[0][0]).toContain(
      'Link inválido ou expirado',
    );
  });

  it('renders a generic error page keeping the http status', () => {
    const response = fakeResponse();

    new WorkOrderApprovalPageFilter().catch(
      new BadRequestException(['reason must be shorter']),
      hostWith(response),
    );

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    const html = response.send.mock.calls[0][0];
    expect(html).toContain('Não foi possível registrar a sua resposta');
    expect(html).not.toContain('reason must be shorter');
  });

  it('logs unexpected errors and answers with 500', () => {
    const response = fakeResponse();
    const errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);

    new WorkOrderApprovalPageFilter().catch(
      new Error('Database offline'),
      hostWith(response),
    );

    expect(response.status).toHaveBeenCalledWith(
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
    expect(response.send.mock.calls[0][0]).not.toContain('Database offline');
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Database offline'),
      expect.any(String),
    );
    errorSpy.mockRestore();
  });
});
