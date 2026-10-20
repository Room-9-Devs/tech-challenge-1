import { describe, it, expect, beforeEach } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesController } from '@/infrastructure/http/controllers/vehicles.controller';
import { CreateVehicleUseCase } from '@/application/use-cases/vehicles/create-vehicle/create-vehicle.use-case';
import { FindVehicleUseCase } from '@/application/use-cases/vehicles/find-vehicle/find-vehicle.use-case';
import { ListVehiclesUseCase } from '@/application/use-cases/vehicles/list-vehicles/list-vehicles.use-case';
import { UpdateVehicleUseCase } from '@/application/use-cases/vehicles/update-vehicle.use-case';
import { DeleteVehicleUseCase } from '@/application/use-cases/vehicles/delete-vehicle.use-case';
import { GetFipeDataUseCase } from '@/application/use-cases/vehicles/get-fipe-data.use-case';
import { CreateVehicleRequestDto } from '@/infrastructure/http/dtos/create-vehicle-request.dto';
import { TOKEN_SERVICE } from '@/application/ports/token-service.port';
import { CurrentUserInterceptor } from '@/infrastructure/http/auth/current-user.interceptor';
import { FindCurrentUserUseCase } from '@/application/use-cases/users/find-current-user/find-current-user.use-case';
import { CurrentUser } from '@/infrastructure/http/auth/current-user.type';

describe('VehiclesController', () => {
  let controller: VehiclesController;
  let createVehicleUseCase: jest.Mocked<CreateVehicleUseCase>;
  let findVehicleUseCase: jest.Mocked<FindVehicleUseCase>;
  let listVehiclesUseCase: jest.Mocked<ListVehiclesUseCase>;
  let updateVehicleUseCase: jest.Mocked<UpdateVehicleUseCase>;
  let deleteVehicleUseCase: jest.Mocked<DeleteVehicleUseCase>;
  let getFipeDataUseCase: jest.Mocked<GetFipeDataUseCase>;

  const currentUser: CurrentUser = {
    id: 'user-1',
    username: 'staff',
    role: 'staff',
    entityType: 'employee',
  };

  beforeEach(async () => {
    const mockCreateVehicleUseCase = {
      execute: jest.fn(),
    };

    const mockFindVehicleUseCase = {
      execute: jest.fn(),
    };

    const mockListVehiclesUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [
        {
          provide: CreateVehicleUseCase,
          useValue: mockCreateVehicleUseCase,
        },
        {
          provide: FindVehicleUseCase,
          useValue: mockFindVehicleUseCase,
        },
        {
          provide: ListVehiclesUseCase,
          useValue: mockListVehiclesUseCase,
        },
        { provide: UpdateVehicleUseCase, useValue: { execute: jest.fn() } },
        { provide: DeleteVehicleUseCase, useValue: { execute: jest.fn() } },
        { provide: GetFipeDataUseCase, useValue: { execute: jest.fn() } },
        {
          provide: TOKEN_SERVICE,
          useValue: { verify: jest.fn().mockReturnValue({ sub: 'user-id', role: 'admin' }) },
        },
        {
          provide: FindCurrentUserUseCase,
          useValue: { execute: jest.fn().mockResolvedValue(currentUser) },
        },
        CurrentUserInterceptor,
      ],
    }).compile();

    controller = module.get<VehiclesController>(VehiclesController);
    createVehicleUseCase = module.get(CreateVehicleUseCase);
    findVehicleUseCase = module.get(FindVehicleUseCase);
    listVehiclesUseCase = module.get(ListVehiclesUseCase);
    updateVehicleUseCase = module.get(UpdateVehicleUseCase);
    deleteVehicleUseCase = module.get(DeleteVehicleUseCase);
    getFipeDataUseCase = module.get(GetFipeDataUseCase);
  });

  describe('create', () => {
    it('should call CreateVehicleUseCase and return the result', async () => {
      const user_id = '550e8400-e29b-41d4-a716-446655440000';
      const dto: CreateVehicleRequestDto = {
        license_plate: 'ABC-1234',
        model: 'Corolla',
        brand: 'Toyota',
        year: 2022,
        color: 'Black',
      };

      const expectedResult = {
        id: 'vehicle-uuid',
        user_id,
        license_plate: 'ABC1234',
        model: 'Corolla',
        brand: 'Toyota',
        year: 2022,
        color: 'Black',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      createVehicleUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.create(user_id, dto, currentUser);

      expect(createVehicleUseCase.execute).toHaveBeenCalledWith({
        user_id,
        ...dto,
        createdBy: currentUser.username,
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findById', () => {
    it('should call FindVehicleUseCase and return the result', async () => {
      const id = 'vehicle-uuid';
      const expectedResult = {
        id,
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        license_plate: 'ABC1D23',
        model: 'Corolla',
        brand: 'Toyota',
        year: 2022,
        color: 'Black',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      findVehicleUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.findById(id);

      expect(findVehicleUseCase.execute).toHaveBeenCalledWith({ id });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should call ListVehiclesUseCase and return the result', async () => {
      const expectedResult = {
        data: [
          {
            id: 'vehicle-uuid',
            user_id: '550e8400-e29b-41d4-a716-446655440000',
            license_plate: 'ABC1234',
            model: 'Corolla',
            brand: 'Toyota',
            year: 2022,
            color: 'Black',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        meta: {
          page: 1,
          limit: 10,
          totalItems: 1,
          totalPages: 1,
        },
      };

      listVehiclesUseCase.execute.mockResolvedValue(expectedResult);

      const result = await controller.findAll({} as never);

      expect(listVehiclesUseCase.execute).toHaveBeenCalled();
      expect(result).toEqual(expectedResult);
    });
  });

  it('delegates update, delete and FIPE requests', async () => {
    const details = { license_plate: 'ABC1D23', model: 'Corolla', brand: 'Toyota', year: 2022, color: 'Black' };
    updateVehicleUseCase.execute.mockResolvedValue({ id: 'vehicle-1', user_id: 'user-1', ...details, createdAt: new Date(), updatedAt: new Date() });
    getFipeDataUseCase.execute.mockResolvedValue([]);
    await controller.update('vehicle-1', details, currentUser);
    await controller.delete('vehicle-1', currentUser);
    await controller.getFipeData('001004-9');
    expect(updateVehicleUseCase.execute).toHaveBeenCalledWith({ id: 'vehicle-1', ...details, createdBy: currentUser.username });
    expect(deleteVehicleUseCase.execute).toHaveBeenCalledWith('vehicle-1', currentUser.username);
    expect(getFipeDataUseCase.execute).toHaveBeenCalledWith('001004-9');
  });
});
