export const EVENT_ENTITY_TYPES = [
  'client',
  'employee',
  'user',
  'vehicle',
  'product',
  'stock',
  'repair',
  'work_order',
] as const;

export type EventEntityType = (typeof EVENT_ENTITY_TYPES)[number];

export function isEventEntityType(value: string): value is EventEntityType {
  return EVENT_ENTITY_TYPES.includes(value as EventEntityType);
}
