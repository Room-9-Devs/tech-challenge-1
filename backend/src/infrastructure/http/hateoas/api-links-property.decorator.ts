import { ApiPropertyOptional } from '@nestjs/swagger';
import { Links } from './link.types';

/** Documenta no Swagger o campo `_links` (HATEOAS) de uma resposta. */
export const ApiLinksProperty = (example: Links) =>
  ApiPropertyOptional({
    description:
      'Links HATEOAS com as ações disponíveis para o recurso (variam conforme o estado e a role do usuário)',
    type: 'object',
    additionalProperties: {
      type: 'object',
      properties: {
        href: { type: 'string' },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        },
      },
    },
    example,
  });
