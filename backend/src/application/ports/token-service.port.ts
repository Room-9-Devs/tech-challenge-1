export const TOKEN_SERVICE = Symbol('TOKEN_SERVICE');

export interface AccessTokenPayload {
  sub: string;
  role: string;
  entityType: 'client' | 'employee';
}

export interface TokenService {
  sign(payload: AccessTokenPayload): string;
  verify(token: string): AccessTokenPayload;
}
