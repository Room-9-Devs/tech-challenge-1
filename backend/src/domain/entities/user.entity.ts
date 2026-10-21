import { randomUUID } from 'crypto';
import { InvalidUserError } from '../errors/invalid-user.error';
import { InvalidRoleAssignmentError } from '../errors/invalid-role-assignment.error';

export type UserEntityType = 'client' | 'employee';

export interface UserProps {
  id?: string;
  username: string;
  email: string;
  password: string;
  entityType: UserEntityType;
  entityId: string;
  roleId: string;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  private readonly _id: string;
  private _username: string;
  private _email: string;
  private _password: string;
  private readonly _entityType: UserEntityType;
  private readonly _entityId: string;
  private _roleId: string;
  private _deletedAt: Date | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: UserProps) {
    this._id = props.id ?? randomUUID();
    this._username = props.username;
    this._email = props.email.toLowerCase();
    this._password = props.password;
    this._entityType = props.entityType;
    this._entityId = props.entityId;
    this._roleId = props.roleId;
    this._deletedAt = props.deletedAt ?? null;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
  }

  public static create(props: UserProps): User {
    User.validate(props);
    return new User(props);
  }

  public static reconstitute(props: UserProps): User {
    return new User(props);
  }

  get id(): string { return this._id; }
  get username(): string { return this._username; }
  get email(): string { return this._email; }
  get password(): string { return this._password; }
  get entityType(): UserEntityType { return this._entityType; }
  get entityId(): string { return this._entityId; }
  get roleId(): string { return this._roleId; }
  get deletedAt(): Date | null { return this._deletedAt; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }

  public changeUsername(username: string): void {
    if (!username || username.trim().length < 3) {
      throw new InvalidUserError('O nome de usuário deve ter pelo menos 3 caracteres');
    }
    this._username = username;
    this._updatedAt = new Date();
  }

  public changeEmail(email: string): void {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      throw new InvalidUserError('E-mail inválido');
    }
    this._email = email.toLowerCase();
    this._updatedAt = new Date();
  }

  public changePassword(password: string): void {
    if (!password) throw new InvalidUserError('A senha é obrigatória');
    this._password = password;
    this._updatedAt = new Date();
  }

  public changeRole(roleId: string, roleSlug: string): void {
    if (!roleId) throw new InvalidUserError('A role é obrigatória');
    if (!User.isRoleAllowed(this._entityType, roleSlug)) {
      throw new InvalidRoleAssignmentError(this._entityType, roleSlug);
    }
    this._roleId = roleId;
    this._updatedAt = new Date();
  }

  public deactivate(): void {
    if (this._deletedAt) {
      throw new InvalidUserError('O usuário já está desativado');
    }
    this._deletedAt = new Date();
    this._updatedAt = this._deletedAt;
  }

  public static isRoleAllowed(entityType: UserEntityType, roleSlug: string): boolean {
    if (entityType === 'client') return roleSlug === 'client';
    return roleSlug === 'staff' || roleSlug === 'admin';
  }

  private static validate(props: UserProps): void {
    if (!props.username || props.username.trim().length < 3) {
      throw new InvalidUserError('O nome de usuário deve ter pelo menos 3 caracteres');
    }
    if (!props.email || !/^\S+@\S+\.\S+$/.test(props.email)) {
      throw new InvalidUserError('E-mail inválido');
    }
    if (!props.password) throw new InvalidUserError('A senha é obrigatória');
    if (!['client', 'employee'].includes(props.entityType)) {
      throw new InvalidUserError('Tipo de entidade inválido');
    }
    if (!props.entityId || !props.roleId) {
      throw new InvalidUserError('A entidade e a role são obrigatórias');
    }
  }

}
