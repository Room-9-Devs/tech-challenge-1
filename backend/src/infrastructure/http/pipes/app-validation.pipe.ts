import { ValidationError, ValidationPipe } from '@nestjs/common';
import { translateValidationMessage } from './validation-messages';

// Configuração global de validação da API, com as mensagens em português.
export class AppValidationPipe extends ValidationPipe {
  constructor() {
    super({ whitelist: true, forbidNonWhitelisted: true, transform: true });
  }

  protected flattenValidationErrors(validationErrors: ValidationError[]): string[] {
    return super.flattenValidationErrors(validationErrors).map(translateValidationMessage);
  }
}
