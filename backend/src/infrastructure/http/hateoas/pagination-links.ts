import { HateoasContext, Links, PaginationMetaLike, link } from './link.types';

const buildQueryString = (
  query: Record<string, unknown>,
  page: number,
  limit: number,
): string => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (key === 'page' || key === 'limit') continue;
    if (typeof value === 'string') params.append(key, value);
    if (Array.isArray(value)) {
      value
        .filter((v): v is string => typeof v === 'string')
        .forEach((v) => params.append(key, v));
    }
  }

  params.set('page', String(page));
  params.set('limit', String(limit));

  return params.toString();
};

export const buildPaginationLinks = (
  basePath: string,
  context: HateoasContext,
  meta: PaginationMetaLike,
): Links => {
  const href = (page: number) =>
    `${basePath}?${buildQueryString(context.query, page, meta.limit)}`;
  const lastPage = Math.max(meta.totalPages, 1);

  const links: Links = {
    self: link(href(meta.page)),
    first: link(href(1)),
  };

  if (meta.page > 1) links.prev = link(href(Math.min(meta.page - 1, lastPage)));
  if (meta.page < lastPage) links.next = link(href(meta.page + 1));
  links.last = link(href(lastPage));

  return links;
};
