import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Observable, map } from 'rxjs';
import { AccessTokenPayload } from '@/application/ports/token-service.port';
import { HateoasContext, PaginationMetaLike } from './link.types';
import { HATEOAS_KEY, HateoasMetadata } from './hateoas.metadata';

@Injectable()
export class HateoasInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const metadata = this.reflector.get<HateoasMetadata>(
      HATEOAS_KEY,
      context.getHandler(),
    );
    if (!metadata) return next.handle();

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AccessTokenPayload }>();
    const hateoasContext: HateoasContext = {
      role: request.user?.role,
      userId: request.user?.sub,
      query: (request.query ?? {}) as Record<string, unknown>,
    };

    return next
      .handle()
      .pipe(map((body) => applyLinks(body, metadata, hateoasContext)));
  }
}

export const applyLinks = (
  body: unknown,
  { builder, kind }: HateoasMetadata,
  context: HateoasContext,
): unknown => {
  if (!body || typeof body !== 'object') return body;

  if (kind === 'item') {
    return { ...body, _links: builder.item(body, context) };
  }

  // Listas sem paginação (array puro): só os itens recebem links,
  // para não mudar o formato da resposta.
  if (Array.isArray(body)) {
    return body.map((item) => ({
      ...item,
      _links: builder.item(item, context),
    }));
  }

  const collection = body as Record<string, unknown>;
  const items = collection.data;

  return {
    ...collection,
    data: Array.isArray(items)
      ? items.map((item) => ({ ...item, _links: builder.item(item, context) }))
      : items,
    _links: builder.collection(
      context,
      collection.meta as PaginationMetaLike | undefined,
    ),
  };
};
