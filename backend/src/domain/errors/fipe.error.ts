import { DomainError } from './domain.error';

export class FipeNotFoundError extends DomainError {
  readonly statusCode = 404;
  constructor() {
    super('Código FIPE não encontrado');
  }
}

export class FipeUnavailableError extends DomainError {
  readonly statusCode = 502;
  constructor() {
    super('O serviço da FIPE está indisponível ou retornou dados inválidos');
  }
}

export class FipeTimeoutError extends DomainError {
  readonly statusCode = 504;
  constructor() {
    super('O serviço da FIPE não respondeu a tempo');
  }
}

export class FipeRateLimitError extends DomainError {
  readonly statusCode = 503;
  constructor() {
    super('A cota de requisições ao serviço da FIPE foi excedida; tente novamente mais tarde');
  }
}
