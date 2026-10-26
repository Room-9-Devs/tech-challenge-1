import { SetMetadata, UseInterceptors, applyDecorators } from '@nestjs/common';
import { ResourceLinksBuilder } from './link.types';
import { HATEOAS_KEY, HateoasMetadata } from './hateoas.metadata';
import { HateoasInterceptor } from './hateoas.interceptor';

/** Adiciona `_links` a uma resposta com um único recurso. */
export const HateoasItem = (builder: ResourceLinksBuilder<any>) =>
  applyDecorators(
    SetMetadata(HATEOAS_KEY, { builder, kind: 'item' } as HateoasMetadata),
    UseInterceptors(HateoasInterceptor),
  );

/**
 * Adiciona `_links` a cada item de `data` e à coleção paginada (`meta`).
 * Se a resposta for um array puro, apenas os itens recebem `_links`.
 */
export const HateoasCollection = (builder: ResourceLinksBuilder<any>) =>
  applyDecorators(
    SetMetadata(HATEOAS_KEY, {
      builder,
      kind: 'collection',
    } as HateoasMetadata),
    UseInterceptors(HateoasInterceptor),
  );
