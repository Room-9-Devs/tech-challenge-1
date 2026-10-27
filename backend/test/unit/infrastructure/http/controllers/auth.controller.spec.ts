import { AuthController } from '@/infrastructure/http/auth/auth.controller';

describe('AuthController', () => {
  it('delegates login to the login use case with the request origin', async () => {
    const login = { execute: jest.fn().mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' }) };
    const controller = new AuthController(login as never, {} as never, {} as never, {} as never);
    const input = { login: 'jose', password: 'password123' };
    const request = { ip: '203.0.113.10', headers: { 'user-agent': 'PostmanRuntime/7.43.0' } };

    await expect(controller.loginUser(request as never, input)).resolves.toEqual({ accessToken: 'access', refreshToken: 'refresh' });
    expect(login.execute).toHaveBeenCalledWith({ ...input, ip: '203.0.113.10', userAgent: 'PostmanRuntime/7.43.0' });
  });

  it('delegates refresh and logout tokens', async () => {
    const refresh = { execute: jest.fn().mockResolvedValue({ accessToken: 'new-access' }) };
    const logout = { execute: jest.fn().mockResolvedValue(undefined) };
    const controller = new AuthController({} as never, refresh as never, logout as never, {} as never);

    await controller.refreshToken({ refreshToken: 'refresh' });
    await controller.logoutUser({ refreshToken: 'refresh' });
    expect(refresh.execute).toHaveBeenCalledWith('refresh');
    expect(logout.execute).toHaveBeenCalledWith('refresh');
  });

  it('delegates authenticated password changes', async () => {
    const change = { execute: jest.fn().mockResolvedValue(undefined) };
    const controller = new AuthController({} as never, {} as never, {} as never, change as never);
    await controller.change({ user: { sub: 'user-1' } } as never, { currentPassword: 'old', newPassword: 'new-password' });
    expect(change.execute).toHaveBeenCalledWith('user-1', 'old', 'new-password');
  });
});
