import { ServiceType } from '@/domain/entities/service-type.entity';
import { InvalidServiceTypeError } from '@/domain/errors/invalid-service-type.error';

describe('ServiceType Entity', () => {
  describe('create', () => {
    it('should create a service type with valid data', () => {
      const serviceType = ServiceType.create({
        description: 'Troca de óleo',
        unitValue: 120.0,
      });

      expect(serviceType).toBeInstanceOf(ServiceType);
      expect(serviceType.id).toBeDefined();
      expect(serviceType.description).toBe('Troca de óleo');
      expect(serviceType.unitValue).toBe(120.0);
      expect(serviceType.createdAt).toBeInstanceOf(Date);
      expect(serviceType.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw InvalidServiceTypeError when description is empty', () => {
      expect(() =>
        ServiceType.create({
          description: '',
          unitValue: 120.0,
        }),
      ).toThrow(InvalidServiceTypeError);
    });

    it('should throw InvalidServiceTypeError when description is too short', () => {
      expect(() =>
        ServiceType.create({
          description: 'A',
          unitValue: 120.0,
        }),
      ).toThrow(InvalidServiceTypeError);
    });

    it('should throw InvalidServiceTypeError when description is too long', () => {
      expect(() =>
        ServiceType.create({
          description: 'A'.repeat(256),
          unitValue: 120.0,
        }),
      ).toThrow(InvalidServiceTypeError);
    });

    it('should throw InvalidServiceTypeError when unit value is negative', () => {
      expect(() =>
        ServiceType.create({
          description: 'Troca de óleo',
          unitValue: -1,
        }),
      ).toThrow(InvalidServiceTypeError);
    });

    it('should throw InvalidServiceTypeError when unit value is not a number', () => {
      expect(() =>
        ServiceType.create({
          description: 'Troca de óleo',
          unitValue: Number('invalid'),
        }),
      ).toThrow(InvalidServiceTypeError);
    });

    it('should accept unit value equal to 0', () => {
      const serviceType = ServiceType.create({
        description: 'Serviço gratuito',
        unitValue: 0,
      });

      expect(serviceType.unitValue).toBe(0);
    });
  });

  describe('changeDescription', () => {
    it('should update the description', () => {
      const serviceType = ServiceType.create({
        description: 'Troca de óleo',
        unitValue: 120.0,
      });

      const previousUpdatedAt = serviceType.updatedAt;

      serviceType.changeDescription('Troca de óleo sintético');

      expect(serviceType.description).toBe('Troca de óleo sintético');
      expect(serviceType.updatedAt.getTime()).toBeGreaterThanOrEqual(
        previousUpdatedAt.getTime(),
      );
    });

    it('should throw InvalidServiceTypeError when new description is invalid', () => {
      const serviceType = ServiceType.create({
        description: 'Troca de óleo',
        unitValue: 120.0,
      });

      expect(() => serviceType.changeDescription('')).toThrow(
        InvalidServiceTypeError,
      );
    });
  });

  describe('changeUnitValue', () => {
    it('should update the unit value', () => {
      const serviceType = ServiceType.create({
        description: 'Troca de óleo',
        unitValue: 120.0,
      });

      const previousUpdatedAt = serviceType.updatedAt;

      serviceType.changeUnitValue(150.0);

      expect(serviceType.unitValue).toBe(150.0);
      expect(serviceType.updatedAt.getTime()).toBeGreaterThanOrEqual(
        previousUpdatedAt.getTime(),
      );
    });

    it('should throw InvalidServiceTypeError when new unit value is negative', () => {
      const serviceType = ServiceType.create({
        description: 'Troca de óleo',
        unitValue: 120.0,
      });

      expect(() => serviceType.changeUnitValue(-10)).toThrow(
        InvalidServiceTypeError,
      );
    });
  });
});
