import { Inject, Injectable } from '@nestjs/common';
import { FIPE_GATEWAY, FipeGateway, FipePrice } from '@/application/ports/fipe.gateway';
import { DomainError } from '@/domain/errors/domain.error';

export class InvalidFipeCodeError extends DomainError {
  readonly statusCode = 400;
  constructor() { super('FIPE code must follow the format 000000-0'); }
}

@Injectable()
export class GetFipeDataUseCase {
  constructor(@Inject(FIPE_GATEWAY) private readonly gateway: FipeGateway) {}

  async execute(code: string): Promise<FipePrice[]> {
    if (!/^\d{6}-\d$/.test(code)) throw new InvalidFipeCodeError();
    return this.gateway.getPrices(code);
  }
}
