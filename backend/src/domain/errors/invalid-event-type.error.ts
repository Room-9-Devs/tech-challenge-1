export class InvalidEventTypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEventTypeError';
  }
}
