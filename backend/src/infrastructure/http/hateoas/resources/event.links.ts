import {
  Links,
  ResourceLinksBuilder,
  eventsHref,
  isStaffRole,
  link,
} from '../link.types';

const EVENT_TYPES_PATH = '/event-types';

// Entidades de evento que têm rota de consulta por ID na API
const ENTITY_PATHS: Record<string, string> = {
  user: '/users',
  vehicle: '/vehicles',
  product: '/products',
  repair: '/repairs',
  work_order: '/work-orders',
};

export const eventTypeLinks: ResourceLinksBuilder<{ id: string }> = {
  item(eventType) {
    const href = `${EVENT_TYPES_PATH}/${eventType.id}`;
    return {
      self: link(href),
      update: link(href, 'PUT'),
    };
  },

  collection() {
    return {
      self: link(EVENT_TYPES_PATH),
      create: link(EVENT_TYPES_PATH, 'POST'),
    };
  },
};

export const eventLinks: ResourceLinksBuilder<{
  eventTypeId: string;
  entityType: string;
  entityId: string;
}> = {
  item(event, context) {
    const links: Links = {
      history: link(eventsHref(event.entityType, event.entityId)),
    };

    // Tipos de evento e as entidades ligadas são restritos a admin/staff
    if (isStaffRole(context.role)) {
      links['event-type'] = link(`${EVENT_TYPES_PATH}/${event.eventTypeId}`);

      const entityPath = ENTITY_PATHS[event.entityType];
      if (entityPath) {
        links.entity = link(`${entityPath}/${event.entityId}`);
      }
    }

    return links;
  },

  collection() {
    return { create: link('/events', 'POST') };
  },
};
