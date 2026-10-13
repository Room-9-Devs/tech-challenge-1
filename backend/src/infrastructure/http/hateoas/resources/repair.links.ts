import {
  Links,
  ResourceLinksBuilder,
  eventsHref,
  isStaffRole,
  link,
} from '../link.types';
import { buildPaginationLinks } from '../pagination-links';

const BASE_PATH = '/repairs';

export const repairLinks: ResourceLinksBuilder<{ id: string }> = {
  item(repair, context) {
    const href = `${BASE_PATH}/${repair.id}`;
    const links: Links = { self: link(href) };

    if (isStaffRole(context.role)) {
      links.update = link(href, 'PUT');
      links.delete = link(href, 'DELETE');
    }

    links.events = link(eventsHref('repair', repair.id));

    return links;
  },

  collection(context, meta) {
    const links: Links = meta
      ? buildPaginationLinks(BASE_PATH, context, meta)
      : { self: link(BASE_PATH) };

    if (isStaffRole(context.role)) links.create = link(BASE_PATH, 'POST');

    return links;
  },
};
