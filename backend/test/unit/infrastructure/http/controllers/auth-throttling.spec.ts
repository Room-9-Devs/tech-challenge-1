import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import * as request from 'supertest';
import { AppValidationPipe } from '@/infrastructure/http/pipes/app-validation.pipe';
import { AuthController } from '@/infrastructure/http/auth/auth.controller';
import { JwtAuthGuard } from '@/infrastructure/http/auth/jwt-auth.guard';
import { LoginUseCase } from '@/application/use-cases/auth/login.use-case';
import { RefreshTokenUseCase } from '@/application/use-cases/auth/refresh-token.use-case';
import { LogoutUseCase } from '@/application/use-cases/auth/logout.use-case';
import { ChangePasswordUseCase } from '@/application/use-cases/auth/change-password.use-case';

describe('Auth HTTP throttling', () => {
  let app: INestApplication;
  const login = { execute: jest.fn().mockResolvedValue({ accessToken: 'access' }) };
  const refresh = { execute: jest.fn().mockResolvedValue({ accessToken: 'access' }) };
  const logout = { execute: jest.fn().mockResolvedValue(undefined) };
  const credentials = { login: 'jose.silveira', password: 'password123' };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        ThrottlerModule.forRoot({
          throttlers: [{ ttl: 60_000, limit: 3 }],
          errorMessage: 'Muitas tentativas. Aguarde um minuto e tente novamente.',
        }),
      ],
      controllers: [AuthController],
      providers: [
        { provide: LoginUseCase, useValue: login },
        { provide: RefreshTokenUseCase, useValue: refresh },
        { provide: LogoutUseCase, useValue: logout },
        { provide: ChangePasswordUseCase, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new AppValidationPipe());
    await app.init();
  });
  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  it('POST /auth/login returns 429 after the limit of attempts per minute', async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      await request(app.getHttpServer()).post('/auth/login').send(credentials).expect(200);
    }

    const response = await request(app.getHttpServer()).post('/auth/login').send(credentials).expect(429);

    expect(response.body.message).toBe('Muitas tentativas. Aguarde um minuto e tente novamente.');
    expect(login.execute).toHaveBeenCalledTimes(3);
  });

  it('POST /auth/refresh is also limited', async () => {
    for (let attempt = 0; attempt < 3; attempt++) {
      await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken: 'refresh' }).expect(200);
    }

    await request(app.getHttpServer()).post('/auth/refresh').send({ refreshToken: 'refresh' }).expect(429);
    expect(refresh.execute).toHaveBeenCalledTimes(3);
  });

  it('POST /auth/logout is not limited', async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      await request(app.getHttpServer()).post('/auth/logout').send({ refreshToken: 'refresh' }).expect(204);
    }
  });
});
