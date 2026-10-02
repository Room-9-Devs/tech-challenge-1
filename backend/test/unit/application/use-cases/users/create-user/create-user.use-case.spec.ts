import { CreateUserUseCase } from '@/application/use-cases/users/create-user/create-user.use-case';
import { FakeUserRepository } from '../../../../../fakes/fake-user.repository';
import { FakeProfileRepository } from '../../../../../fakes/fake-profile.repository';
import { FakeRoleRepository } from '../../../../../fakes/fake-role.repository';
import { FakePasswordHasher } from '../../../../../fakes/fake-password-hasher';
import { UserAlreadyExistsError } from '@/domain/errors/user-already-exists.error';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let users: FakeUserRepository;
  let profiles: FakeProfileRepository;

  beforeEach(() => {
    users = new FakeUserRepository();
    profiles = new FakeProfileRepository();
    useCase = new CreateUserUseCase(users, new FakePasswordHasher(), profiles, new FakeRoleRepository());
  });

  it('creates a client with the client role and a profile', async () => {
    const result = await useCase.execute({
      username: 'agnaldo.guimaraes', email: 'agnaldo@example.com', password: 'password123', entityType: 'client',
      name: 'Agnaldo Guimarães', documentType: 'CPF', document: '11111111111', phone: '11999999999',
    });

    expect(result.role).toBe('client');
    expect(result.profile.document).toBe('11111111111');
    expect(result.profile.jobTitle).toBeUndefined();
    expect((await users.findById(result.id))?.password).toBe('hash:password123');
  });

  it('creates an employee with the lowest employee role and optional job title', async () => {
    const result = await useCase.execute({
      username: 'jose.silveira', email: 'jose@example.com', password: 'password123', entityType: 'employee',
      name: 'José Silveira', documentType: 'CPF', document: '22222222222', phone: '11999999991', jobTitle: 'mecânico',
    });

    expect(result.role).toBe('staff');
    expect(result.profile.document).toBe('22222222222');
    expect(result.profile.jobTitle).toBe('mecânico');
  });

  it('allows an employee without a job title', async () => {
    const result = await useCase.execute({
      username: 'novo.funcionario', email: 'novo@example.com', password: 'password123', entityType: 'employee',
      name: 'Novo Funcionário', documentType: 'CPF', document: '33333333333', phone: '11999999992',
    });

    expect(result.profile.jobTitle).toBeUndefined();
  });

  it('rejects duplicated email or username', async () => {
    const input = {
      username: 'duplicado', email: 'duplicado@example.com', password: 'password123', entityType: 'client' as const,
      name: 'Cliente Duplicado', documentType: 'CPF' as const, document: '44444444444', phone: '11999999993',
    };
    await useCase.execute(input);

    await expect(useCase.execute({ ...input, document: '55555555555' })).rejects.toThrow(UserAlreadyExistsError);
  });

  it('rejects when the default role is missing or incompatible', async () => {
    const input = {
      username: 'role-test', email: 'role@example.com', password: 'password123', entityType: 'client' as const,
      name: 'Role Test', documentType: 'CPF' as const, document: '66666666666', phone: '11999999994',
    };
    const missingRole = { findBySlug: jest.fn().mockResolvedValue(null) };
    await expect(new CreateUserUseCase(users, new FakePasswordHasher(), profiles, missingRole as never).execute(input)).rejects.toThrow('Role with slug client not found');
    const incompatibleRole = { findBySlug: jest.fn().mockResolvedValue({ id: 'role-admin', slug: 'admin', name: 'Administrador' }) };
    await expect(new CreateUserUseCase(users, new FakePasswordHasher(), profiles, incompatibleRole as never).execute(input)).rejects.toThrow('cannot be assigned');
  });
});
