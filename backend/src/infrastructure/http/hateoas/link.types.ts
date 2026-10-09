export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface Link {
  href: string;
  method: HttpMethod;
}

export type Links = Record<string, Link>;

export interface PaginationMetaLike {
  page: number;
  limit: number;
  totalPages: number;
}

export interface HateoasContext {
  role?: string;
  userId?: string;
  query: Record<string, unknown>;
}

export interface ResourceLinksBuilder<T> {
  item(resource: T, context: HateoasContext): Links;
  collection(context: HateoasContext, meta?: PaginationMetaLike): Links;
}

export const link = (href: string, method: HttpMethod = 'GET'): Link => ({
  href,
  method,
});

export const isStaffRole = (role?: string): boolean =>
  role === 'admin' || role === 'staff';

/** Monta um link de listagem com o parâmetro `filters` (JSON) aplicado. */
export const filteredHref = (
  basePath: string,
  filters: Record<string, string>,
): string =>
  `${basePath}?filters=${encodeURIComponent(JSON.stringify(filters))}`;

/** Histórico de eventos de uma entidade (`GET /events/:entityType/:entityId`). */
export const eventsHref = (entityType: string, entityId: string): string =>
  `/events/${entityType}/${entityId}`;
