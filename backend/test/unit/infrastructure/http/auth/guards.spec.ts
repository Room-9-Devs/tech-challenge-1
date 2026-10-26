import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '@/infrastructure/http/auth/jwt-auth.guard';
import { RolesGuard } from '@/infrastructure/http/auth/roles.guard';

describe('JwtAuthGuard', () => {
  const context = (request: any) => ({ switchToHttp: () => ({ getRequest: () => request }) }) as any;

  it('stores the verified token payload on the request', () => {
    const request: any = { headers: { authorization: 'Bearer token' } };
    const tokens = { verify: jest.fn().mockReturnValue({ sub: 'user-1', role: 'client', entityType: 'client' }) };
    expect(new JwtAuthGuard(tokens as never).canActivate(context(request))).toBe(true);
    expect(request.user.sub).toBe('user-1');
  });

  it('rejects missing authorization headers', () => {
    const request: any = { headers: {} };
    expect(() => new JwtAuthGuard({} as never).canActivate(context(request))).toThrow(UnauthorizedException);
  });
});

describe('RolesGuard', () => {
  const context = (request: any) => ({ getHandler: () => 'handler', getClass: () => 'class', switchToHttp: () => ({ getRequest: () => request }) }) as any;

  it('allows routes without role metadata', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(undefined) };
    expect(new RolesGuard(reflector as never).canActivate(context({ user: { role: 'client' } }))).toBe(true);
  });

  it('allows matching roles and rejects insufficient roles', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(['admin', 'staff']) };
    const guard = new RolesGuard(reflector as never);
    expect(guard.canActivate(context({ user: { role: 'staff' } }))).toBe(true);
    expect(() => guard.canActivate(context({ user: { role: 'client' } }))).toThrow(ForbiddenException);
  });
});
