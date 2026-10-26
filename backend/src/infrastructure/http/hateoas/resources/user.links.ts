import {
  Links,
  ResourceLinksBuilder,
  eventsHref,
  isStaffRole,
  link,
} from '../link.types';
import { buildPaginationLinks } from '../pagination-links';
import { vehiclesByOwnerHref } from './vehicle.links';

const BASE_PATH = '/users';

export const userLinks: ResourceLinksBuilder<{
  id: string;
  entityType: 'client' | 'employee';
}> = {
  item(user, context) {
    // Clientes só acessam os próprios dados via /users/me
    if (!isStaffRole(context.role)) {
      return { self: link(`${BASE_PATH}/me`) };
    }

    const links: Links = { self: link(`${BASE_PATH}/${user.id}`) };

    if (user.entityType === 'client') {
      links.vehicles = link(vehiclesByOwnerHref(user.id));
      links['add-vehicle'] = link(`/vehicles/${user.id}`, 'POST');
    }

    links.events = link(eventsHref('user', user.id));

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
