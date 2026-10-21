import { BadRequestException, Injectable, ParseUUIDPipe } from '@nestjs/common';

// ParseUUIDPipe do Nest com a mensagem de erro em português.
@Injectable()
export class ParseUuidPipe extends ParseUUIDPipe {
  constructor() {
    super({
      exceptionFactory: () => new BadRequestException('O ID informado não é um UUID válido'),
    });
  }
}
