import { randomUUID } from 'crypto';
import { InvalidUserError } from '../errors/invalid-user.error';

export interface UserProps {
  id?: string;
  name: string;
  email: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  private readonly _id: string;
  private _name: string;
  private _email: string;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: UserProps) {
    this._id = props.id ?? randomUUID();
    this._name = props.name;
    this._email = props.email;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  public static create(props: UserProps): User {
    User.validateName(props.name);
    User.validateEmail(props.email);

    return new User(props);
  }

  public static reconstitute(props: UserProps): User {
    return new User(props);
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get email(): string {
    return this._email;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  public changeName(name: string): void {
    User.validateName(name);
    this._name = name;
    this._updatedAt = new Date();
  }

  public changeEmail(email: string): void {
    User.validateEmail(email);
    this._email = email;
    this._updatedAt = new Date();
  }

  private static validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new InvalidUserError('Name is required');
    }
    if (name.trim().length < 2) {
      throw new InvalidUserError('Name must be at least 2 characters long');
    }
    if (name.trim().length > 100) {
      throw new InvalidUserError('Name must be at most 100 characters long');
    }
  }

  private static validateEmail(email: string): void {
    if (!email || email.trim().length === 0) {
      throw new InvalidUserError('Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new InvalidUserError('Invalid email format');
    }
  }
}
