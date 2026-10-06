import { ScryptPasswordHasherService } from '@/infrastructure/services/password/scrypt-password-hasher.service';
import { OpaqueRefreshTokenService } from '@/infrastructure/services/jwt/opaque-refresh-token.service';
jest.mock('@nestjs/jwt', () => ({ JwtService: class {} }));
import { JwtTokenService } from '@/infrastructure/services/jwt/jwt-token.service';
import { UnauthorizedException } from '@nestjs/common';

describe('ScryptPasswordHasherService', () => {
  it('hashes and compares a password', async () => {
    const service = new ScryptPasswordHasherService();
    const hash = await service.hash('password123');
    expect(hash.startsWith('scrypt$')).toBe(true);
    await expect(service.compare('password123', hash)).resolves.toBe(true);
    await expect(service.compare('wrong', hash)).resolves.toBe(false);
  });

  it('rejects malformed hashes', async () => {
    await expect(new ScryptPasswordHasherService().compare('password', 'invalid')).resolves.toBe(false);
  });
});

describe('OpaqueRefreshTokenService', () => {
  it('generates and hashes opaque tokens', () => {
    const service = new OpaqueRefreshTokenService();
    const token = service.generate();
    expect(token).toBeTruthy();
    expect(service.hash(token)).toHaveLength(64);
  });
});

describe('JwtTokenService', () => {
  it('signs and verifies tokens through JwtService', () => {
    const jwt = { sign: jest.fn().mockReturnValue('jwt'), verify: jest.fn().mockReturnValue({ sub: 'user-1', role: 'client', entityType: 'client' }) };
    const service = new JwtTokenService(jwt as never);
    const payload = { sub: 'user-1', role: 'client', entityType: 'client' as const };
    expect(service.sign(payload)).toBe('jwt');
    expect(service.verify('jwt').sub).toBe('user-1');
  });

  it('translates invalid JWT errors to UnauthorizedException', () => {
    const jwt = { verify: jest.fn().mockImplementation(() => { throw new Error('invalid'); }) };
    expect(() => new JwtTokenService(jwt as never).verify('bad')).toThrow(UnauthorizedException);
  });
});
