import { WorkOrderQuote } from '@/application/services/work-order-quote.service';

// Sem o e-mail do cliente: a página de aprovação não precisa expor esse dado.
export type GetWorkOrderApprovalOutputDto = Omit<WorkOrderQuote, 'email'>;
