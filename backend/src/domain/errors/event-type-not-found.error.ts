export class EventTypeNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Event type not found: ${identifier}`);
    this.name = 'EventTypeNotFoundError';
  }
}
