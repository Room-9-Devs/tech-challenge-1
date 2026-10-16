export const WORK_ORDER_NUMBER_GENERATOR = Symbol(
  'WORK_ORDER_NUMBER_GENERATOR',
);

export interface WorkOrderNumberGenerator {
  next(): Promise<string>;
}
