import { DomainError } from './domain.error';

export class FipeNotFoundError extends DomainError {
  readonly statusCode = 404;
  constructor() {
    super('FIPE code not found');
  }
}

export class FipeUnavailableError extends DomainError {
  readonly statusCode = 502;
  constructor() {
    super('FIPE service is unavailable or returned invalid data');
  }
}

export class FipeTimeoutError extends DomainError {
  readonly statusCode = 504;
  constructor() {
    super('FIPE service timed out');
  }
}

export class FipeRateLimitError extends DomainError {
  readonly statusCode = 503;
  constructor() {
    super('FIPE service request quota exceeded; try again later');
  }
}
