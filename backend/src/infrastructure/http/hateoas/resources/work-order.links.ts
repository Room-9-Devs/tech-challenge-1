import { WorkOrderStatus } from '@/domain/entities/work-order-status.enum';
import {
  Links,
  ResourceLinksBuilder,
  eventsHref,
  isStaffRole,
  link,
} from '../link.types';
import { buildPaginationLinks } from '../pagination-links';

const BASE_PATH = '/work-orders';

// Itens só podem ser alterados antes do envio do orçamento (WorkOrder.ensureItemsCanChange)
const EDITABLE_STATUSES = [
  WorkOrderStatus.RECEIVED,
  WorkOrderStatus.UNDER_DIAGNOSIS,
];

export const workOrderLinks: ResourceLinksBuilder<{
  id: string;
  status: WorkOrderStatus;
  vehicleId: string;
  clientId: string;
  items?: { id: string }[];
}> = {
  item(order, context) {
    const href = `${BASE_PATH}/${order.id}`;
    const statusHref = `${href}/status`;
    const isStaff = isStaffRole(context.role);
    const links: Links = { self: link(href) };

    if (isStaff) {
      links.vehicle = link(`/vehicles/${order.vehicleId}`);
      links.client = link(`/users/${order.clientId}`);
    }
    links.events = link(eventsHref('work_order', order.id));

    // Decisão do orçamento: equipe ou o próprio cliente da OS
    const canDecide = isStaff || context.userId === order.clientId;
    if (order.status === WorkOrderStatus.AWAITING_APPROVAL && canDecide) {
      links.approve = link(statusHref, 'PATCH');
      links.reject = link(statusHref, 'PATCH');
    }

    if (!isStaff) return links;

    if (EDITABLE_STATUSES.includes(order.status)) {
      links['add-item'] = link(`${href}/items`, 'POST');
    }

    switch (order.status) {
      case WorkOrderStatus.RECEIVED:
        links['start-diagnosis'] = link(statusHref, 'PATCH');
        break;
      case WorkOrderStatus.UNDER_DIAGNOSIS:
        // A OS precisa de ao menos um item para aguardar aprovação
        if (order.items?.length) {
          links['send-quote'] = link(statusHref, 'PATCH');
        }
        break;
      case WorkOrderStatus.APPROVED:
        // O início do serviço exige o pagamento confirmado
        links['confirm-payment'] = link(`${href}/payment-confirmation`, 'POST');
        links.start = link(statusHref, 'PATCH');
        break;
      case WorkOrderStatus.IN_PROGRESS:
        links.complete = link(statusHref, 'PATCH');
        break;
      case WorkOrderStatus.COMPLETED:
        links.deliver = link(statusHref, 'PATCH');
        break;
    }

    return links;
  },

  collection(context, meta) {
    const links: Links = meta
      ? buildPaginationLinks(BASE_PATH, context, meta)
      : { self: link(BASE_PATH) };

    if (isStaffRole(context.role)) links.create = link(BASE_PATH, 'POST');

    return links;
  },
};

export const workOrderPaymentLinks: ResourceLinksBuilder<{
  workOrderId: string;
}> = {
  item(payment) {
    const href = `${BASE_PATH}/${payment.workOrderId}`;
    return {
      'work-order': link(href),
      start: link(`${href}/status`, 'PATCH'),
      events: link(eventsHref('work_order', payment.workOrderId)),
    };
  },

  collection() {
    return { self: link(BASE_PATH) };
  },
};
