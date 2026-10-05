import { Repair } from '@/domain/entities/repair.entity';
import { InvalidRepairError } from '@/domain/errors/invalid-repair.error';

describe('Repair Entity', () => {
  describe('create', () => {
    it('should create a repair with valid data', () => {
      const repair = Repair.create({
        description: 'Troca de óleo',
        unitValue: 120.0,
      });

      expect(repair).toBeInstanceOf(Repair);
      expect(repair.id).toBeDefined();
      expect(repair.description).toBe('Troca de óleo');
      expect(repair.unitValue).toBe(120.0);
      expect(repair.createdAt).toBeInstanceOf(Date);
      expect(repair.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw InvalidRepairError when description is empty', () => {
      expect(() =>
        Repair.create({
          description: '',
          unitValue: 120.0,
        }),
      ).toThrow(InvalidRepairError);
    });

    it('should throw InvalidRepairError when description is too short', () => {
      expect(() =>
        Repair.create({
          description: 'A',
          unitValue: 120.0,
        }),
      ).toThrow(InvalidRepairError);
    });

    it('should throw InvalidRepairError when description is too long', () => {
      expect(() =>
        Repair.create({
          description: 'A'.repeat(256),
          unitValue: 120.0,
        }),
      ).toThrow(InvalidRepairError);
    });

    it('should throw InvalidRepairError when unit value is negative', () => {
      expect(() =>
        Repair.create({
          description: 'Troca de óleo',
          unitValue: -10,
        }),
      ).toThrow(InvalidRepairError);
    });

    it('should throw InvalidRepairError when unit value is not a number', () => {
      expect(() =>
        Repair.create({
          description: 'Troca de óleo',
          unitValue: Number('invalid'),
        }),
      ).toThrow(InvalidRepairError);
    });

    it('should accept zero as unit value', () => {
      const repair = Repair.create({
        description: 'Troca de óleo',
        unitValue: 0,
      });

      expect(repair.unitValue).toBe(0);
    });

    it('should reject non-numeric unit values', () => {
      expect(() => Repair.create({ description: 'Serviço', unitValue: Number.NaN })).toThrow(InvalidRepairError);
    });
  });

  describe('changeDescription', () => {
    it('should update description and updatedAt', () => {
      const repair = Repair.create({
        description: 'Troca de óleo',
        unitValue: 120.0,
      });

      const previousUpdatedAt = repair.updatedAt;

      repair.changeDescription('Troca de óleo sintético');

      expect(repair.description).toBe('Troca de óleo sintético');
      expect(repair.updatedAt.getTime()).toBeGreaterThanOrEqual(
        previousUpdatedAt.getTime(),
      );
    });

    it('should throw InvalidRepairError when new description is invalid', () => {
      const repair = Repair.create({
        description: 'Troca de óleo',
        unitValue: 120.0,
      });

      expect(() => repair.changeDescription('')).toThrow(
        InvalidRepairError,
      );
    });
  });

  describe('changeUnitValue', () => {
    it('should update unit value and updatedAt', () => {
      const repair = Repair.create({
        description: 'Troca de óleo',
        unitValue: 120.0,
      });

      const previousUpdatedAt = repair.updatedAt;

      repair.changeUnitValue(150.0);

      expect(repair.unitValue).toBe(150.0);
      expect(repair.updatedAt.getTime()).toBeGreaterThanOrEqual(
        previousUpdatedAt.getTime(),
      );
    });

    it('should throw InvalidRepairError when new unit value is negative', () => {
      const repair = Repair.create({
        description: 'Troca de óleo',
        unitValue: 120.0,
      });

      expect(() => repair.changeUnitValue(-10)).toThrow(
        InvalidRepairError,
      );
    });
  });
});
