import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { User } from '@/domain/entities/user.entity';
import { UserRepository } from '@/domain/repositories/user.repository';
import { UserOrmEntity } from '../entities/user.orm-entity';
import { ClientOrmEntity } from '../entities/client.orm-entity';
import { EmployeeOrmEntity } from '../entities/employee.orm-entity';
import { UserMapper } from '../mappers/user.mapper';
import { UserAlreadyExistsError } from '@/domain/errors/user-already-exists.error';
import { PaginatedOutput, PaginationQuery } from '@/shared/pagination/pagination.types';
import { applyPagination } from '@/shared/pagination/typeorm-pagination.helper';

// O nome do usuário mora nos perfis (clients/employees), não na tabela users.
const PROFILE_NAME_EXPRESSION = 'COALESCE(client.name, employee.name)';
const PROFILE_NAME_ALIAS = 'profile_name';
const PROFILE_NAME_FIELD = 'profile.name';

// O CPF/CNPJ do usuário também mora no perfil, em uma única coluna `document`.
const PROFILE_DOCUMENT_EXPRESSION = 'COALESCE(client.document, employee.document)';
const PROFILE_DOCUMENT_TYPE_EXPRESSION =
  'COALESCE(client.document_type, employee.document_type)';
const PROFILE_DOCUMENT_FIELD = 'profile.document';

// O documento é gravado sem máscara e em maiúsculas (o CNPJ pode ser alfanumérico),
// mas costuma ser informado com máscara; precisamos dele igual à coluna.
const normalizeDocument = (value: unknown): string =>
  typeof value === 'string'
    ? value.replace(/[.\-/ \s]/g, '').toUpperCase()
    : String(value ?? '');

@Injectable()
export class TypeOrmUserRepository implements UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repository: Repository<UserOrmEntity>,
  ) { }

  async save(user: User): Promise<User> {
    const ormEntity = UserMapper.toPersistence(user);
    try {
      const saved = await this.repository.save(ormEntity);
      return UserMapper.toDomain(saved);
    } catch (error) {
      if (
        error instanceof QueryFailedError &&
        error.driverError.code === '23505'
      ) {
        throw new UserAlreadyExistsError(user.email);
      }
      throw error;
    }
  }

  async findById(id: string): Promise<User | null> {
    const ormEntity = await this.repository.findOne({ where: { id } });
    return ormEntity ? UserMapper.toDomain(ormEntity) : null;
  }

  async findAll(query?: PaginationQuery & { filters?: Record<string, string | number> }): Promise<PaginatedOutput<User>> {

    const { filters, ...paginationQuery } = query ?? {
      page: 1,
      limit: 10,
    };

    const queryBuilder = this.repository.createQueryBuilder('user');

    // O nome do usuário vive no perfil (clients/employees), não na tabela users.
    queryBuilder
      .leftJoin(
        ClientOrmEntity,
        'client',
        'client."id" = "user"."entity_id" AND "user"."entity_type" = \'client\'',
      )
      .leftJoin(
        EmployeeOrmEntity,
        'employee',
        'employee."id" = "user"."entity_id" AND "user"."entity_type" = \'employee\'',
      );

    const allowedFilters = [
      'username',
      'email',
      'entityType',
      PROFILE_NAME_FIELD,
      PROFILE_DOCUMENT_FIELD,
      'cpf',
      'cnpj',
    ];

    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (!allowedFilters.includes(key)) continue;

        if (key === PROFILE_NAME_FIELD) {
          queryBuilder.andWhere(
            `${PROFILE_NAME_EXPRESSION} = :filter_profile_name`,
            { filter_profile_name: value },
          );
          continue;
        }

        if (key === PROFILE_DOCUMENT_FIELD) {
          queryBuilder.andWhere(
            `${PROFILE_DOCUMENT_EXPRESSION} = :filter_profile_document`,
            { filter_profile_document: normalizeDocument(value) },
          );
          continue;
        }

        if (key === 'cpf' || key === 'cnpj') {
          const documentType = key.toUpperCase();
          queryBuilder.andWhere(
            `${PROFILE_DOCUMENT_EXPRESSION} = :filter_${key}_document AND ${PROFILE_DOCUMENT_TYPE_EXPRESSION} = :filter_${key}_type`,
            {
              [`filter_${key}_document`]: normalizeDocument(value),
              [`filter_${key}_type`]: documentType,
            },
          );
          continue;
        }

        const paramName = `filter_${key}`;
        queryBuilder.andWhere(`user.${key} = :${paramName}`, {
          [paramName]: value,
        });
      }
    }

    // Com joins o TypeORM pagina em duas queries e interpreta chaves de ORDER BY
    // com ponto como `alias.propriedade`, então o nome é exposto no SELECT como
    // uma coluna calculada e ordenado pelo alias.
    if (paginationQuery.sort?.some(({ field }) => field === PROFILE_NAME_FIELD)) {
      queryBuilder.addSelect(PROFILE_NAME_EXPRESSION, PROFILE_NAME_ALIAS);
    }

    applyPagination(queryBuilder, paginationQuery, {
      searchColumns: ['user.username', 'user.email', 'client.name', 'employee.name'],
      alias: 'user',
      allowedSortColumns: [
        PROFILE_NAME_FIELD,
        'username',
        'email',
        'entityType',
        'createdAt',
        'updatedAt',
      ],
      sortColumnMap: { [PROFILE_NAME_FIELD]: PROFILE_NAME_ALIAS },
    });

    const [ormEntities, totalItems] = await queryBuilder.getManyAndCount();

    return {
      data: ormEntities.map((entity) => UserMapper.toDomain(entity)),
      meta: {
        page: paginationQuery.page,
        limit: paginationQuery.limit,
        totalItems,
        totalPages: Math.ceil(totalItems / paginationQuery.limit) || 1,
      },
    };
  }

  async findByEmail(email: string): Promise<User | null> {
    const ormEntity = await this.repository.findOne({ where: { email } });
    return ormEntity ? UserMapper.toDomain(ormEntity) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const ormEntity = await this.repository.findOne({ where: { username } });
    return ormEntity ? UserMapper.toDomain(ormEntity) : null;
  }
}