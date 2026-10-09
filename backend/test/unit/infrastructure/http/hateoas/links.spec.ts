import { buildPaginationLinks } from '@/infrastructure/http/hateoas/pagination-links';
import { applyLinks } from '@/infrastructure/http/hateoas/hateoas.interceptor';
import { productLinks } from '@/infrastructure/http/hateoas/resources/product.links';
import { repairLinks } from '@/infrastructure/http/hateoas/resources/repair.links';
import { vehicleLinks } from '@/infrastructure/http/hateoas/resources/vehicle.links';
import { userLinks } from '@/infrastructure/http/hateoas/resources/user.links';
import { HateoasContext } from '@/infrastructure/http/hateoas/link.types';
import {
  stockLinks,
  stockMovementLinks,
} from '@/infrastructure/http/hateoas/resources/stock.links';
import {
  eventLinks,
  eventTypeLinks,
} from '@/infrastructure/http/hateoas/resources/event.links';

const adminContext: HateoasContext = { role: 'admin', query: {} };
const clientContext: HateoasContext = { role: 'client', query: {} };

describe('HATEOAS links', () => {
  describe('buildPaginationLinks', () => {
    it('builds first/prev/next/last for a middle page', () => {
      const links = buildPaginationLinks('/products', adminContext, {
        page: 2,
        limit: 10,
        totalPages: 5,
      });

      expect(links).toEqual({
        self: { href: '/products?page=2&limit=10', method: 'GET' },
        first: { href: '/products?page=1&limit=10', method: 'GET' },
        prev: { href: '/products?page=1&limit=10', method: 'GET' },
        next: { href: '/products?page=3&limit=10', method: 'GET' },
        last: { href: '/products?page=5&limit=10', method: 'GET' },
      });
    });

    it('omits prev on the first page and next on the last page', () => {
      const first = buildPaginationLinks('/products', adminContext, {
        page: 1,
        limit: 10,
        totalPages: 1,
      });

      expect(first.prev).toBeUndefined();
      expect(first.next).toBeUndefined();
      expect(first.last.href).toBe('/products?page=1&limit=10');
    });

    it('keeps search, sort and filters in the generated links', () => {
      const links = buildPaginationLinks(
        '/products',
        {
          role: 'admin',
          query: {
            page: '1',
            search: 'óleo',
            filters: '{"productType":"PART"}',
          },
        },
        { page: 1, limit: 10, totalPages: 2 },
      );

      const next = new URL(links.next.href, 'http://localhost');
      expect(next.pathname).toBe('/products');
      expect(next.searchParams.get('search')).toBe('óleo');
      expect(next.searchParams.get('filters')).toBe('{"productType":"PART"}');
      expect(next.searchParams.get('page')).toBe('2');
      expect(next.searchParams.get('limit')).toBe('10');
    });
  });

  describe('productLinks', () => {
    it('exposes self, update and delete for an active product', () => {
      expect(
        productLinks.item({ id: 'p1', active: true }, adminContext),
      ).toMatchObject({
        self: { href: '/products/p1', method: 'GET' },
        update: { href: '/products/p1', method: 'PUT' },
        delete: { href: '/products/p1', method: 'DELETE' },
      });
    });

    it('does not expose delete for an inactive product', () => {
      const links = productLinks.item(
        { id: 'p1', active: false },
        adminContext,
      );
      expect(links.delete).toBeUndefined();
    });

    it('exposes create in the collection', () => {
      expect(productLinks.collection(adminContext).create).toEqual({
        href: '/products',
        method: 'POST',
      });
    });
  });

  describe('repairLinks', () => {
    it('exposes write actions to staff', () => {
      const links = repairLinks.item(
        { id: 'r1' },
        { ...adminContext, role: 'staff' },
      );
      expect(Object.keys(links)).toEqual(['self', 'update', 'delete', 'events']);
    });

    it('exposes only read links to clients', () => {
      expect(repairLinks.item({ id: 'r1' }, clientContext)).toEqual({
        self: { href: '/repairs/r1', method: 'GET' },
        events: { href: '/events/repair/r1', method: 'GET' },
      });
      expect(
        repairLinks.collection(clientContext, {
          page: 1,
          limit: 10,
          totalPages: 1,
        }).create,
      ).toBeUndefined();
    });
  });

  describe('vehicleLinks', () => {
    it('links the vehicle to its owner', () => {
      const links = vehicleLinks.item(
        { id: 'v1', user_id: 'u1' },
        adminContext,
      );
      expect(links.owner).toEqual({ href: '/users/u1', method: 'GET' });
    });

    it('omits owner for legacy vehicles without user', () => {
      const links = vehicleLinks.item(
        { id: 'v1', user_id: null },
        adminContext,
      );
      expect(links.owner).toBeUndefined();
    });
  });

  describe('userLinks', () => {
    it('links a client to its vehicles for staff users', () => {
      const links = userLinks.item(
        { id: 'u1', entityType: 'client' },
        adminContext,
      );

      expect(links.self.href).toBe('/users/u1');
      expect(links['add-vehicle']).toEqual({
        href: '/vehicles/u1',
        method: 'POST',
      });
      const vehicles = new URL(links.vehicles.href, 'http://localhost');
      expect(vehicles.searchParams.get('filters')).toBe('{"userId":"u1"}');
    });

    it('does not link employees to vehicles', () => {
      const links = userLinks.item(
        { id: 'u1', entityType: 'employee' },
        adminContext,
      );
      expect(links.vehicles).toBeUndefined();
    });

    it('points clients to /users/me', () => {
      expect(
        userLinks.item({ id: 'u1', entityType: 'client' }, clientContext),
      ).toEqual({ self: { href: '/users/me', method: 'GET' } });
    });

    it('builds pagination links for the collection keeping filters', () => {
      const links = userLinks.collection(
        { role: 'admin', query: { filters: '{"entityType":"client"}' } },
        { page: 1, limit: 10, totalPages: 2 },
      );

      const next = new URL(links.next.href, 'http://localhost');
      expect(next.pathname).toBe('/users');
      expect(next.searchParams.get('filters')).toBe('{"entityType":"client"}');
      expect(next.searchParams.get('page')).toBe('2');
      expect(links.create).toEqual({ href: '/users', method: 'POST' });
    });
  });

  describe('events links on existing resources', () => {
    it('links each resource to its event history', () => {
      expect(productLinks.item({ id: 'p1' }, adminContext).events.href).toBe(
        '/events/product/p1',
      );
      expect(repairLinks.item({ id: 'r1' }, clientContext).events.href).toBe(
        '/events/repair/r1',
      );
      expect(
        vehicleLinks.item({ id: 'v1', user_id: null }, adminContext).events
          .href,
      ).toBe('/events/vehicle/v1');
      expect(
        userLinks.item({ id: 'u1', entityType: 'employee' }, adminContext)
          .events.href,
      ).toBe('/events/user/u1');
    });

    it('links a product to its stock and movements', () => {
      const links = productLinks.item({ id: 'p1' }, adminContext);
      const stock = new URL(links.stock.href, 'http://localhost');
      expect(stock.pathname).toBe('/stock');
      expect(stock.searchParams.get('filters')).toBe('{"productId":"p1"}');
      expect(new URL(links.movements.href, 'http://localhost').pathname).toBe(
        '/stock/movements',
      );
    });
  });

  describe('stockLinks', () => {
    it('links a stock entry to product, movements and new movement', () => {
      const links = stockLinks.item(
        { id: 's1', productId: 'p1' },
        adminContext,
      );

      expect(links.product).toEqual({ href: '/products/p1', method: 'GET' });
      expect(links['add-movement']).toEqual({
        href: '/stock/movements',
        method: 'POST',
      });
      expect(links.events.href).toBe('/events/stock/s1');
      const movements = new URL(links.movements.href, 'http://localhost');
      expect(movements.searchParams.get('filters')).toBe('{"productId":"p1"}');
    });

    it('paginates the stock collection', () => {
      const links = stockLinks.collection(adminContext, {
        page: 1,
        limit: 10,
        totalPages: 2,
      });
      expect(links.next.href).toBe('/stock?page=2&limit=10');
      expect(links.movements.href).toBe('/stock/movements');
    });
  });

  describe('stockMovementLinks', () => {
    it('links a movement to product, stock and creator', () => {
      const links = stockMovementLinks.item(
        { productId: 'p1', createdBy: 'u1' },
        adminContext,
      );
      expect(links.product.href).toBe('/products/p1');
      expect(links.creator.href).toBe('/users/u1');
      expect(new URL(links.stock.href, 'http://localhost').pathname).toBe(
        '/stock',
      );
    });

    it('keeps the date range in the pagination links', () => {
      const links = stockMovementLinks.collection(
        {
          role: 'admin',
          query: { startDate: '2026-10-01T00:00:00.000Z' },
        },
        { page: 1, limit: 10, totalPages: 3 },
      );
      const next = new URL(links.next.href, 'http://localhost');
      expect(next.pathname).toBe('/stock/movements');
      expect(next.searchParams.get('startDate')).toBe(
        '2026-10-01T00:00:00.000Z',
      );
      expect(links.create.method).toBe('POST');
    });
  });

  describe('eventTypeLinks', () => {
    it('exposes self and update', () => {
      expect(eventTypeLinks.item({ id: 'et1' }, adminContext)).toEqual({
        self: { href: '/event-types/et1', method: 'GET' },
        update: { href: '/event-types/et1', method: 'PUT' },
      });
    });
  });

  describe('eventLinks', () => {
    const event = {
      eventTypeId: 'et1',
      entityType: 'product',
      entityId: 'p1',
    };

    it('links staff to the event type and the related entity', () => {
      expect(eventLinks.item(event, adminContext)).toEqual({
        history: { href: '/events/product/p1', method: 'GET' },
        'event-type': { href: '/event-types/et1', method: 'GET' },
        entity: { href: '/products/p1', method: 'GET' },
      });
    });

    it('omits entity when it has no route by id', () => {
      const links = eventLinks.item(
        { ...event, entityType: 'client' },
        adminContext,
      );
      expect(links.entity).toBeUndefined();
    });

    it('exposes only the history to clients', () => {
      expect(eventLinks.item(event, clientContext)).toEqual({
        history: { href: '/events/product/p1', method: 'GET' },
      });
    });
  });

  describe('applyLinks', () => {
    it('adds links to items of a plain array without changing its shape', () => {
      const result = applyLinks(
        [{ id: 'et1' }, { id: 'et2' }],
        { builder: eventTypeLinks, kind: 'collection' },
        adminContext,
      ) as any[];

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
      expect(result[1]._links.self.href).toBe('/event-types/et2');
    });

    it('adds links to each item and to the paginated collection', () => {
      const result = applyLinks(
        {
          data: [{ id: 'u1', entityType: 'employee' }],
          meta: { page: 1, limit: 10, totalItems: 1, totalPages: 1 },
        },
        { builder: userLinks, kind: 'collection' },
        adminContext,
      ) as any;

      expect(result.data[0]._links.self.href).toBe('/users/u1');
      expect(result.meta.totalItems).toBe(1);
      expect(result._links.self.href).toBe('/users?page=1&limit=10');
      expect(result._links.create.method).toBe('POST');
    });

    it('returns empty bodies untouched', () => {
      expect(
        applyLinks(
          undefined,
          { builder: productLinks, kind: 'item' },
          adminContext,
        ),
      ).toBeUndefined();
    });
  });
});
