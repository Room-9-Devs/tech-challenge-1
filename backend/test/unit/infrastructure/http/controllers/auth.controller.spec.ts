import { AuthController } from '@/infrastructure/http/auth/auth.controller';

describe('AuthController', () => {
  it('delegates login to the login use case', async () => {
    const login = { execute: jest.fn().mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' }) };
    const controller = new AuthController(login as never, {} as never, {} as never, {} as never);
    const input = { login: 'jose', password: 'password123' };

    await expect(controller.loginUser(input)).resolves.toEqual({ accessToken: 'access', refreshToken: 'refresh' });
    expect(login.execute).toHaveBeenCalledWith(input);
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
});
