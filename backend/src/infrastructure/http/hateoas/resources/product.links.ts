import {
  Links,
  ResourceLinksBuilder,
  eventsHref,
  filteredHref,
  link,
} from '../link.types';
import { buildPaginationLinks } from '../pagination-links';

const BASE_PATH = '/products';

export const productLinks: ResourceLinksBuilder<{
  id: string;
  active?: boolean;
}> = {
  item(product) {
    const href = `${BASE_PATH}/${product.id}`;
    const links: Links = {
      self: link(href),
      update: link(href, 'PUT'),
    };

    if (product.active !== false) links.delete = link(href, 'DELETE');

    links.stock = link(filteredHref('/stock', { productId: product.id }));
    links.movements = link(
      filteredHref('/stock/movements', { productId: product.id }),
    );
    links.events = link(eventsHref('product', product.id));

    return links;
  },

  collection(context, meta) {
    return {
      ...(meta
        ? buildPaginationLinks(BASE_PATH, context, meta)
        : { self: link(BASE_PATH) }),
      create: link(BASE_PATH, 'POST'),
    };
  },
};
