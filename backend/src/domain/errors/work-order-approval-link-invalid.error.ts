import { DomainError } from './domain.error';

// Mensagem única para token inexistente, expirado, usado ou revogado: não dá pistas a quem testa links.
export class WorkOrderApprovalLinkInvalidError extends DomainError {
  readonly statusCode = 404;

  constructor() {
    super('Link de aprovação inválido ou expirado');
  }
}
