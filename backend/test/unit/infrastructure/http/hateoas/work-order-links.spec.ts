import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import { HateoasContext } from '@/infrastructure/http/hateoas/link.types';
import {
  workOrderLinks,
  workOrderPaymentLinks,
} from '@/infrastructure/http/hateoas/resources/work-order.links';

const staffContext: HateoasContext = { role: 'staff', userId: 's1', query: {} };
const ownerContext: HateoasContext = { role: 'client', userId: 'c1', query: {} };
const otherClientContext: HateoasContext = {
  role: 'client',
  userId: 'c2',
  query: {},
};

const order = (status: WorkOrderStatus, items = [{ id: 'i1' }]) => ({
  id: 'wo1',
  status,
  vehicleId: 'v1',
  clientId: 'c1',
  items,
});

const STATUS_HREF = '/work-orders/wo1/status';

describe('workOrderLinks', () => {
  it('links staff to the related resources and to the next actions', () => {
    expect(
      workOrderLinks.item(order(WorkOrderStatus.RECEIVED), staffContext),
    ).toEqual({
      self: { href: '/work-orders/wo1', method: 'GET' },
      vehicle: { href: '/vehicles/v1', method: 'GET' },
      client: { href: '/users/c1', method: 'GET' },
      events: { href: '/events/work_order/wo1', method: 'GET' },
      'add-item': { href: '/work-orders/wo1/items', method: 'POST' },
      'start-diagnosis': { href: STATUS_HREF, method: 'PATCH' },
    });
  });

  it('offers send-quote only when the order has items', () => {
    const withItems = workOrderLinks.item(
      order(WorkOrderStatus.UNDER_DIAGNOSIS),
      staffContext,
    );
    expect(withItems['send-quote']).toEqual({
      href: STATUS_HREF,
      method: 'PATCH',
    });
    expect(withItems['add-item']).toBeDefined();

    const empty = workOrderLinks.item(
      order(WorkOrderStatus.UNDER_DIAGNOSIS, []),
      staffContext,
    );
    expect(empty['send-quote']).toBeUndefined();
  });

  it('lets the owner client approve or reject a quote', () => {
    expect(
      workOrderLinks.item(
        order(WorkOrderStatus.AWAITING_APPROVAL),
        ownerContext,
      ),
    ).toEqual({
      self: { href: '/work-orders/wo1', method: 'GET' },
      events: { href: '/events/work_order/wo1', method: 'GET' },
      approve: { href: STATUS_HREF, method: 'PATCH' },
      reject: { href: STATUS_HREF, method: 'PATCH' },
    });
  });

  it('does not offer the decision to another client', () => {
    const links = workOrderLinks.item(
      order(WorkOrderStatus.AWAITING_APPROVAL),
      otherClientContext,
    );
    expect(links.approve).toBeUndefined();
    expect(links.reject).toBeUndefined();
  });

  it('follows the rest of the flow for staff', () => {
    const approved = workOrderLinks.item(
      order(WorkOrderStatus.APPROVED),
      staffContext,
    );
    expect(approved['confirm-payment']).toEqual({
      href: '/work-orders/wo1/payment-confirmation',
      method: 'POST',
    });
    expect(approved.start.method).toBe('PATCH');
    expect(approved['add-item']).toBeUndefined();

    expect(
      workOrderLinks.item(order(WorkOrderStatus.IN_PROGRESS), staffContext)
        .complete,
    ).toBeDefined();
    expect(
      workOrderLinks.item(order(WorkOrderStatus.COMPLETED), staffContext)
        .deliver,
    ).toBeDefined();
  });

  it.each([WorkOrderStatus.DELIVERED, WorkOrderStatus.CANCELLED])(
    'exposes no actions on a %s order',
    (status) => {
      expect(Object.keys(workOrderLinks.item(order(status), staffContext)))
        .toEqual(['self', 'vehicle', 'client', 'events']);
    },
  );

  it('exposes only reading links to clients outside the approval step', () => {
    expect(
      Object.keys(
        workOrderLinks.item(order(WorkOrderStatus.RECEIVED), ownerContext),
      ),
    ).toEqual(['self', 'events']);
  });

  it('builds pagination links and create only for staff', () => {
    const meta = { page: 1, limit: 10, totalPages: 2 };

    const staff = workOrderLinks.collection(staffContext, meta);
    expect(staff.next.href).toBe('/work-orders?page=2&limit=10');
    expect(staff.create).toEqual({ href: '/work-orders', method: 'POST' });

    expect(workOrderLinks.collection(ownerContext, meta).create).toBeUndefined();
  });
});

describe('workOrderPaymentLinks', () => {
  it('points back to the work order and to the start of the service', () => {
    expect(
      workOrderPaymentLinks.item(
        { workOrderId: 'wo1' },
        staffContext,
      ),
    ).toEqual({
      'work-order': { href: '/work-orders/wo1', method: 'GET' },
      start: { href: STATUS_HREF, method: 'PATCH' },
      events: { href: '/events/work_order/wo1', method: 'GET' },
    });
  });
});
