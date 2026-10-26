import { ResourceLinksBuilder } from './link.types';

export const HATEOAS_KEY = 'hateoas';

export interface HateoasMetadata {
  builder: ResourceLinksBuilder<any>;
  kind: 'item' | 'collection';
}
