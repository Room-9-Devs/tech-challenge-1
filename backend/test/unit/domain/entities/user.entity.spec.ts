import { User } from '@/domain/entities/user.entity';
import { InvalidUserError } from '@/domain/errors/invalid-user.error';

describe('User Entity', () => {
  describe('create', () => {
    it('should create a user with valid data', () => {
      const user = User.create({
        name: 'John Doe',
        email: 'john@example.com',
      });

      expect(user).toBeInstanceOf(User);
      expect(user.id).toBeDefined();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should throw InvalidUserError when name is empty', () => {
      expect(() =>
        User.create({
          name: '',
          email: 'john@example.com',
        }),
      ).toThrow(InvalidUserError);
    });

    it('should throw InvalidUserError when name is too short', () => {
      expect(() =>
        User.create({
          name: 'A',
          email: 'john@example.com',
        }),
      ).toThrow(InvalidUserError);
    });

    it('should throw InvalidUserError when name is too long', () => {
      expect(() =>
        User.create({
          name: 'A'.repeat(101),
          email: 'john@example.com',
        }),
      ).toThrow(InvalidUserError);
    });

    it('should throw InvalidUserError when email is empty', () => {
      expect(() =>
        User.create({
          name: 'John Doe',
          email: '',
        }),
      ).toThrow(InvalidUserError);
    });

    it('should throw InvalidUserError when email format is invalid', () => {
      expect(() =>
        User.create({
          name: 'John Doe',
          email: 'invalid-email',
        }),
      ).toThrow(InvalidUserError);
    });

    it('should accept email with subdomain', () => {
      const user = User.create({
        name: 'John Doe',
        email: 'john@sub.example.com',
      });

      expect(user.email).toBe('john@sub.example.com');
    });
  });

  describe('changeName', () => {
    it('should update the name', () => {
      const user = User.create({
        name: 'John Doe',
        email: 'john@example.com',
      });

      const previousUpdatedAt = user.updatedAt;

      user.changeName('Jane Doe');

      expect(user.name).toBe('Jane Doe');
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(
        previousUpdatedAt.getTime(),
      );
    });

    it('should throw InvalidUserError when new name is invalid', () => {
      const user = User.create({
        name: 'John Doe',
        email: 'john@example.com',
      });

      expect(() => user.changeName('')).toThrow(InvalidUserError);
    });
  });

  describe('changeEmail', () => {
    it('should update the email', () => {
      const user = User.create({
        name: 'John Doe',
        email: 'john@example.com',
      });

      const previousUpdatedAt = user.updatedAt;

      user.changeEmail('jane@example.com');

      expect(user.email).toBe('jane@example.com');
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(
        previousUpdatedAt.getTime(),
      );
    });

    it('should throw InvalidUserError when new email is invalid', () => {
      const user = User.create({
        name: 'John Doe',
        email: 'john@example.com',
      });

      expect(() => user.changeEmail('invalid')).toThrow(InvalidUserError);
    });
  });
});
