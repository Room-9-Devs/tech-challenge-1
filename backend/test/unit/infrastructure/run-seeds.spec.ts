describe('run-seeds entrypoint', () => {
  it('initializes, runs all seeds and destroys the datasource', async () => {
    const dataSource = { initialize: jest.fn().mockResolvedValue(undefined), destroy: jest.fn().mockResolvedValue(undefined) };
    const seedClients = jest.fn().mockResolvedValue(undefined);
    const seedEmployees = jest.fn().mockResolvedValue(undefined);
    const seedRoles = jest.fn().mockResolvedValue(undefined);
    const seedUsers = jest.fn().mockResolvedValue(undefined);
    jest.resetModules();
    jest.doMock('@/infrastructure/database/typeorm/data-source', () => ({ AppDataSource: dataSource }));
    jest.doMock('@/infrastructure/database/seeds/client.seed', () => ({ seedClients }));
    jest.doMock('@/infrastructure/database/seeds/employee.seed', () => ({ seedEmployees }));
    jest.doMock('@/infrastructure/database/seeds/role.seed', () => ({ seedRoles }));
    jest.doMock('@/infrastructure/database/seeds/user.seed', () => ({ seedUsers }));

    require('@/infrastructure/database/seeds/run-seeds');
    await new Promise((resolve) => setTimeout(resolve, 20));

    expect(dataSource.initialize).toHaveBeenCalled();
    expect(seedRoles).toHaveBeenCalledWith(dataSource);
    expect(seedClients).toHaveBeenCalledWith(dataSource);
    expect(seedEmployees).toHaveBeenCalledWith(dataSource);
    expect(seedUsers).toHaveBeenCalledWith(dataSource);
    expect(dataSource.destroy).toHaveBeenCalled();
  }, 30000);
});
