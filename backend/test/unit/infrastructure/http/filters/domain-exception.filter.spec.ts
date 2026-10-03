import { DomainExceptionFilter } from '@/infrastructure/http/filters/domain-exception.filter';
import { InvalidUserError } from '@/domain/errors/invalid-user.error';

describe('DomainExceptionFilter', () => {
  it('serializes domain errors as HTTP responses', () => {
    const response = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const host = { switchToHttp: () => ({ getResponse: () => response }) };
    new DomainExceptionFilter().catch(new InvalidUserError('Invalid user'), host as never);
    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400, message: 'Invalid user' }));
  });
});
