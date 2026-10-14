import { Logger } from '@nestjs/common';
import { WorkOrderNotificationHandler } from '@/application/event-handlers/work-order-notification.handler';
import { WorkOrder } from '@/domain/entities/work-order.entity';
import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import { WorkOrderStatusChangedEvent } from '@/domain/events/work-order.events';
import { DomainEventEmitter } from '@/infrastructure/services/events/domain-event-emitter.service';

describe('WorkOrderNotificationHandler', () => {
  let emitter: DomainEventEmitter;
  let orders: any;
  let notifier: any;
  let errorSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  const order = WorkOrder.reconstitute({
    id: 'order-id',
    number: 'OS-0042/2026',
    status: WorkOrderStatus.AWAITING_APPROVAL,
    vehicleId: 'vehicle-id',
    clientId: 'client-id',
    createdBy: 'staff-id',
  });

  const statusChanged = (from: WorkOrderStatus, to: WorkOrderStatus) =>
    new WorkOrderStatusChangedEvent('order-id', 'staff', 'motivo', {
      from,
      to,
      reason: 'motivo',
    });

  beforeEach(() => {
    emitter = new DomainEventEmitter();
    orders = { findById: jest.fn().mockResolvedValue(order) };
    notifier = {
      notifyAwaitingApproval: jest.fn().mockResolvedValue(undefined),
      notifyCompleted: jest.fn().mockResolvedValue(undefined),
    };
    new WorkOrderNotificationHandler(
      orders,
      notifier,
      emitter,
    ).onApplicationBootstrap();
    errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    warnSpy = jest
      .spyOn(Logger.prototype, 'warn')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should send the quote when the order is awaiting approval', async () => {
    await emitter.emit(
      statusChanged(
        WorkOrderStatus.UNDER_DIAGNOSIS,
        WorkOrderStatus.AWAITING_APPROVAL,
      ),
    );

    expect(orders.findById).toHaveBeenCalledWith('order-id');
    expect(notifier.notifyAwaitingApproval).toHaveBeenCalledWith(order);
    expect(notifier.notifyCompleted).not.toHaveBeenCalled();
  });

  it('should notify the completion when the order is completed', async () => {
    await emitter.emit(
      statusChanged(WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.COMPLETED),
    );

    expect(notifier.notifyCompleted).toHaveBeenCalledWith(order);
    expect(notifier.notifyAwaitingApproval).not.toHaveBeenCalled();
  });

  it.each([
    [WorkOrderStatus.RECEIVED, WorkOrderStatus.UNDER_DIAGNOSIS],
    [WorkOrderStatus.AWAITING_APPROVAL, WorkOrderStatus.APPROVED],
    [WorkOrderStatus.AWAITING_APPROVAL, WorkOrderStatus.CANCELLED],
    [WorkOrderStatus.APPROVED, WorkOrderStatus.IN_PROGRESS],
    [WorkOrderStatus.COMPLETED, WorkOrderStatus.DELIVERED],
  ])(
    'should ignore the change from %s to %s',
    async (from: WorkOrderStatus, to: WorkOrderStatus) => {
      await emitter.emit(statusChanged(from, to));

      expect(orders.findById).not.toHaveBeenCalled();
      expect(notifier.notifyAwaitingApproval).not.toHaveBeenCalled();
      expect(notifier.notifyCompleted).not.toHaveBeenCalled();
    },
  );

  it('should skip and warn when the order is not found', async () => {
    orders.findById.mockResolvedValue(null);

    await emitter.emit(
      statusChanged(WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.COMPLETED),
    );

    expect(notifier.notifyCompleted).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('order-id'));
  });

  it('should log and not reject the publication when loading the order fails', async () => {
    orders.findById.mockRejectedValue(new Error('Database offline'));

    await expect(
      emitter.emit(
        statusChanged(WorkOrderStatus.IN_PROGRESS, WorkOrderStatus.COMPLETED),
      ),
    ).resolves.toBeUndefined();
    expect(notifier.notifyCompleted).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Database offline'),
      expect.any(String),
    );
  });
});
