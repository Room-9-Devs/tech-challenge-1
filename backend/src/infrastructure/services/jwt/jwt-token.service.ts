import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenPayload, TokenService } from '@/application/ports/token-service.port';

@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwtService: JwtService) {}

  sign(payload: AccessTokenPayload): string {
    return this.jwtService.sign(payload);
  }

  verify(token: string): AccessTokenPayload {
    try {
      return this.jwtService.verify<AccessTokenPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
