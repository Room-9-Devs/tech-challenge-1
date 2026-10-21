import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { AppValidationPipe } from '@/infrastructure/http/pipes/app-validation.pipe';
import { ParseUuidPipe } from '@/infrastructure/http/pipes/parse-uuid.pipe';
import { translateValidationMessage } from '@/infrastructure/http/pipes/validation-messages';

class ChildDto {
  @IsString()
  @MaxLength(5)
  name: string;
}

class SampleDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsInt()
  page: number;

  @IsIn(['client'], { each: true })
  types: string[];

  @ValidateNested()
  @Type(() => ChildDto)
  profile: ChildDto;

  @MinLength(2, { message: 'O nome deve ter pelo menos 2 caracteres' })
  custom: string;
}

const messagesOf = async (body: object): Promise<string[]> => {
  try {
    await new AppValidationPipe().transform(body, { type: 'body', metatype: SampleDto });
  } catch (error) {
    return (error as BadRequestException).getResponse()['message'];
  }
  throw new Error('validation should have failed');
};

describe('translateValidationMessage', () => {
  it.each([
    ['username must be a string', 'O campo username deve ser um texto'],
    ['name should not be empty', 'O campo name não pode ser vazio'],
    ['password must be longer than or equal to 8 characters', 'O campo password deve ter pelo menos 8 caracteres'],
    ['profile.name must be shorter than or equal to 150 characters', 'O campo profile.name deve ter no máximo 150 caracteres'],
    ['email must be an email', 'O campo email deve ser um e-mail válido'],
    ['status must be one of the following values: received, approved', 'O campo status deve ser um destes valores: received, approved'],
    ['page must be an integer number', 'O campo page deve ser um número inteiro'],
    ['page must not be less than 1', 'O campo page deve ser maior ou igual a 1'],
    ['limit must not be greater than 100', 'O campo limit deve ser menor ou igual a 100'],
    ['entityId must be a UUID', 'O campo entityId deve ser um UUID válido'],
    ['sort must be a json string', 'O campo sort deve ser um JSON válido'],
    ['metadata must be an object', 'O campo metadata deve ser um objeto'],
    ['allowedEntityTypes must be an array', 'O campo allowedEntityTypes deve ser uma lista'],
    ['code must match /^x$/ regular expression', 'O campo code deve seguir o padrão /^x$/'],
    ['cost must be a number conforming to the specified constraints', 'O campo cost deve ser um número válido'],
    ['startDate must be a valid ISO 8601 date string', 'O campo startDate deve ser uma data no formato ISO 8601'],
    ['property extra should not exist', 'O campo extra não é permitido'],
    ['profile.property extra should not exist', 'O campo profile.extra não é permitido'],
    ['nested property profile must be either object or array', 'O campo profile deve ser um objeto ou uma lista'],
    ['each value in types must be one of the following values: user', 'Cada valor do campo types deve ser um destes valores: user'],
  ])('translates "%s"', (message, expected) => {
    expect(translateValidationMessage(message)).toBe(expected);
  });

  it('keeps custom and unknown messages unchanged', () => {
    expect(translateValidationMessage('O SKU deve ser uma string')).toBe('O SKU deve ser uma string');
    expect(translateValidationMessage('field has an unknown problem')).toBe('field has an unknown problem');
  });
});

describe('AppValidationPipe', () => {
  it('returns validation messages in Portuguese', async () => {
    const messages = await messagesOf({
      username: 'ab',
      page: 1.5,
      types: ['admin'],
      profile: { name: 'muito longo', extra: 1 },
      custom: 'a',
      unknown: true,
    });

    expect(messages).toEqual(
      expect.arrayContaining([
        'O campo unknown não é permitido',
        'O campo username deve ter pelo menos 3 caracteres',
        'O campo page deve ser um número inteiro',
        'Cada valor do campo types deve ser um destes valores: client',
        'O campo profile.extra não é permitido',
        'O campo profile.name deve ter no máximo 5 caracteres',
        'O nome deve ter pelo menos 2 caracteres',
      ]),
    );
  });
});

describe('ParseUuidPipe', () => {
  it('accepts a valid UUID', async () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    await expect(new ParseUuidPipe().transform(id, { type: 'param' })).resolves.toBe(id);
  });

  it('rejects an invalid ID with a Portuguese message', async () => {
    await expect(new ParseUuidPipe().transform('abc', { type: 'param' })).rejects.toThrow(
      new BadRequestException('O ID informado não é um UUID válido'),
    );
  });
});
