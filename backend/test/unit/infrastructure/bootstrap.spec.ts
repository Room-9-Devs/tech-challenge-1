describe('bootstrap entrypoints', () => {
  it('bootstraps the Nest application and Swagger', async () => {
    const app = {
      useGlobalPipes: jest.fn(),
      useGlobalFilters: jest.fn(),
      listen: jest.fn().mockResolvedValue(undefined),
    };
    const seed = { run: jest.fn().mockResolvedValue(undefined) };
    const createDocument = jest.fn().mockReturnValue({});
    const swaggerSetup = jest.fn();
    const builder = {
      setTitle: jest.fn().mockReturnThis(),
      setDescription: jest.fn().mockReturnThis(),
      setVersion: jest.fn().mockReturnThis(),
      addTag: jest.fn().mockReturnThis(),
      addBearerAuth: jest.fn().mockReturnThis(),
      build: jest.fn().mockReturnValue({}),
    };

    jest.resetModules();
    jest.doMock('@nestjs/core', () => ({ NestFactory: { create: jest.fn().mockResolvedValue({ ...app, get: jest.fn().mockReturnValue(seed) }) } }));
    jest.doMock('@nestjs/swagger', () => ({ SwaggerModule: { createDocument, setup: swaggerSetup }, DocumentBuilder: jest.fn(() => builder) }));
    jest.doMock('@/app.module', () => ({ AppModule: class AppModule {} }));
    jest.doMock('@/infrastructure/database/typeorm/seeds/service-type.seed', () => ({ ServiceTypeSeedService: class ServiceTypeSeedService {} }));

    require('@/main');
    await new Promise((resolve) => setImmediate(resolve));
    await new Promise((resolve) => setImmediate(resolve));

    expect(app.useGlobalPipes).toHaveBeenCalled();
    expect(app.useGlobalFilters).toHaveBeenCalled();
    expect(app.listen).toHaveBeenCalled();
    expect(seed.run).toHaveBeenCalled();
    expect(createDocument).toHaveBeenCalled();
    expect(swaggerSetup).toHaveBeenCalled();
  }, 30000);
});
