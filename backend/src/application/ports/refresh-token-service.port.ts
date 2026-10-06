export const REFRESH_TOKEN_SERVICE = Symbol('REFRESH_TOKEN_SERVICE');

export interface RefreshTokenService {
  generate(): string;
  hash(token: string): string;
}
