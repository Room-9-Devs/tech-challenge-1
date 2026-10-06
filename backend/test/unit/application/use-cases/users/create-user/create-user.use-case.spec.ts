import { CreateUserUseCase } from '@/application/use-cases/users/create-user/create-user.use-case';
import { FakeUserRepository } from '../../../../../fakes/fake-user.repository';
import { FakeProfileRepository } from '../../../../../fakes/fake-profile.repository';
import { FakeRoleRepository } from '../../../../../fakes/fake-role.repository';
import { FakePasswordHasher } from '../../../../../fakes/fake-password-hasher';
import { UserAlreadyExistsError } from '@/domain/errors/user-already-exists.error';
import { InvalidUserError } from '@/domain/errors/invalid-user.error';
import { FakeUserRegistrationUnitOfWork } from '../../../../../fakes/fake-user-registration-unit-of-work';

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let users: FakeUserRepository;
  let profiles: FakeProfileRepository;
  let registration: FakeUserRegistrationUnitOfWork;

  beforeEach(() => {
    users = new FakeUserRepository();
    profiles = new FakeProfileRepository();
    registration = new FakeUserRegistrationUnitOfWork(users, profiles);
    useCase = new CreateUserUseCase(
      users,
      new FakePasswordHasher(),
      registration,
      new FakeRoleRepository(),
    );
  });

  it('creates a client with the client role and a profile', async () => {
    const result = await useCase.execute({
      username: 'agnaldo.guimaraes',
      email: 'agnaldo@example.com',
      password: 'password123',
      entityType: 'client',
      name: 'Agnaldo Guimarães',
      documentType: 'CPF',
      document: '52998224725',
      phone: '11999999999',
    });

    expect(result.role).toBe('client');
    expect(result.profile.document).toBe('52998224725');
    expect(result.profile.jobTitle).toBeUndefined();
    expect((await users.findById(result.id))?.password).toBe(
      'hash:password123',
    );
  });

  it('creates an employee with the lowest employee role and optional job title', async () => {
    const result = await useCase.execute({
      username: 'jose.silveira',
      email: 'jose@example.com',
      password: 'password123',
      entityType: 'employee',
      name: 'José Silveira',
      documentType: 'CPF',
      document: '11144477735',
      phone: '11999999991',
      jobTitle: 'mecânico',
    });

    expect(result.role).toBe('staff');
    expect(result.profile.document).toBe('11144477735');
    expect(result.profile.jobTitle).toBe('mecânico');
  });

  it('allows an employee without a job title', async () => {
    const result = await useCase.execute({
      username: 'novo.funcionario',
      email: 'novo@example.com',
      password: 'password123',
      entityType: 'employee',
      name: 'Novo Funcionário',
      documentType: 'CPF',
      document: '12345678909',
      phone: '11999999992',
    });

    expect(result.profile.jobTitle).toBeUndefined();
  });

  it('rejects duplicated email or username', async () => {
    const input = {
      username: 'duplicado',
      email: 'duplicado@example.com',
      password: 'password123',
      entityType: 'client' as const,
      name: 'Cliente Duplicado',
      documentType: 'CPF' as const,
      document: '52998224725',
      phone: '11999999993',
    };
    await useCase.execute(input);

    await expect(
      useCase.execute({ ...input, document: '11144477735' }),
    ).rejects.toThrow(UserAlreadyExistsError);
  });

  it('rejects when the default role is missing or incompatible', async () => {
    const input = {
      username: 'role-test',
      email: 'role@example.com',
      password: 'password123',
      entityType: 'client' as const,
      name: 'Role Test',
      documentType: 'CPF' as const,
      document: '52998224725',
      phone: '11999999994',
    };
    const missingRole = { findBySlug: jest.fn().mockResolvedValue(null) };
    await expect(
      new CreateUserUseCase(
        users,
        new FakePasswordHasher(),
        registration,
        missingRole as never,
      ).execute(input),
    ).rejects.toThrow('Role with slug client not found');
    const incompatibleRole = {
      findBySlug: jest
        .fn()
        .mockResolvedValue({
          id: 'role-admin',
          slug: 'admin',
          name: 'Administrador',
        }),
    };
    await expect(
      new CreateUserUseCase(
        users,
        new FakePasswordHasher(),
        registration,
        incompatibleRole as never,
      ).execute(input),
    ).rejects.toThrow('cannot be assigned');
  });

  it('rejects invalid CPF before creating a profile', async () => {
    const createProfile = jest.spyOn(profiles, 'createClient');
    await expect(
      useCase.execute({
        username: 'invalid.doc',
        email: 'invalid@example.com',
        password: 'password123',
        entityType: 'client',
        name: 'Invalid Document',
        documentType: 'CPF',
        document: '111.111.111-11',
        phone: '11999999999',
      }),
    ).rejects.toThrow(InvalidUserError);
    expect(createProfile).not.toHaveBeenCalled();
  });

  it('accepts a formatted CNPJ and stores only digits', async () => {
    const result = await useCase.execute({
      username: 'company.owner',
      email: 'company@example.com',
      password: 'password123',
      entityType: 'client',
      name: 'Company Owner',
      documentType: 'CNPJ',
      document: '11.222.333/0001-81',
      phone: '11999999999',
    });
    expect(result.profile.document).toBe('11222333000181');
  });

  it('validates the user before starting profile persistence', async () => {
    const createProfile = jest.spyOn(profiles, 'createClient');
    await expect(
      useCase.execute({
        username: '   ',
        email: 'invalid@example.com',
        password: 'password123',
        entityType: 'client',
        name: 'Invalid User',
        documentType: 'CPF',
        document: '52998224725',
        phone: '11999999999',
      }),
    ).rejects.toThrow(InvalidUserError);
    expect(createProfile).not.toHaveBeenCalled();
  });

  it('rolls back the profile if the user cannot be persisted', async () => {
    jest.spyOn(users, 'save').mockRejectedValueOnce(new Error('write failed'));
    await expect(
      useCase.execute({
        username: 'transaction.test',
        email: 'transaction@example.com',
        password: 'password123',
        entityType: 'client',
        name: 'Transaction Test',
        documentType: 'CPF',
        document: '52998224725',
        phone: '11999999999',
      }),
    ).rejects.toThrow('write failed');
    expect(profiles.snapshot()).toEqual([]);
    expect(await users.findAll()).toEqual([]);
  });

  it('accepts and preserves an alphanumeric CNPJ', async () => {
    const result = await useCase.execute({
      username: 'alphanumeric.cnpj',
      email: 'alphanumeric@example.com',
      password: 'password123',
      entityType: 'client',
      name: 'Alphanumeric Company',
      documentType: 'CNPJ',
      document: '12.abc.345/01de-35',
      phone: '11999999999',
    });
    expect(result.profile.document).toBe('12ABC34501DE35');
    expect(result.entityId).toBe(result.profile.id);
  });
});
