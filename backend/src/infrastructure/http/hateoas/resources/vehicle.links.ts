import {
  Links,
  ResourceLinksBuilder,
  eventsHref,
  filteredHref,
  link,
} from '../link.types';
import { buildPaginationLinks } from '../pagination-links';

const BASE_PATH = '/vehicles';

export const vehiclesByOwnerHref = (userId: string): string =>
  filteredHref(BASE_PATH, { userId });

export const vehicleLinks: ResourceLinksBuilder<{
  id: string;
  user_id: string | null;
}> = {
  item(vehicle) {
    const href = `${BASE_PATH}/${vehicle.id}`;
    const links: Links = {
      self: link(href),
      update: link(href, 'PUT'),
      delete: link(href, 'DELETE'),
    };

    if (vehicle.user_id) links.owner = link(`/users/${vehicle.user_id}`);
    links.events = link(eventsHref('vehicle', vehicle.id));

    return links;
  },

  collection(context, meta) {
    return meta
      ? buildPaginationLinks(BASE_PATH, context, meta)
      : { self: link(BASE_PATH) };
  },
};
