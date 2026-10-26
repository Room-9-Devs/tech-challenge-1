import {
  Links,
  ResourceLinksBuilder,
  eventsHref,
  filteredHref,
  link,
} from '../link.types';
import { buildPaginationLinks } from '../pagination-links';

const BASE_PATH = '/stock';
const MOVEMENTS_PATH = `${BASE_PATH}/movements`;

export const stockLinks: ResourceLinksBuilder<{
  id: string;
  productId: string;
}> = {
  item(stock) {
    return {
      self: link(filteredHref(BASE_PATH, { productId: stock.productId })),
      product: link(`/products/${stock.productId}`),
      movements: link(
        filteredHref(MOVEMENTS_PATH, { productId: stock.productId }),
      ),
      'add-movement': link(MOVEMENTS_PATH, 'POST'),
      events: link(eventsHref('stock', stock.id)),
    };
  },

  collection(context, meta) {
    return {
      ...(meta
        ? buildPaginationLinks(BASE_PATH, context, meta)
        : { self: link(BASE_PATH) }),
      movements: link(MOVEMENTS_PATH),
    };
  },
};

export const stockMovementLinks: ResourceLinksBuilder<{
  productId: string;
  createdBy?: string | null;
}> = {
  item(movement) {
    const links: Links = {
      product: link(`/products/${movement.productId}`),
      stock: link(filteredHref(BASE_PATH, { productId: movement.productId })),
      'product-movements': link(
        filteredHref(MOVEMENTS_PATH, { productId: movement.productId }),
      ),
    };

    if (movement.createdBy) {
      links.creator = link(`/users/${movement.createdBy}`);
    }

    return links;
  },

  collection(context, meta) {
    return {
      ...(meta
        ? buildPaginationLinks(MOVEMENTS_PATH, context, meta)
        : { self: link(MOVEMENTS_PATH) }),
      create: link(MOVEMENTS_PATH, 'POST'),
      stock: link(BASE_PATH),
    };
  },
};
