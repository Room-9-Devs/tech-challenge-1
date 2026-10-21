// Traduz as mensagens padrão do class-validator e do ValidationPipe.
// Mensagens definidas no próprio decorator (já em português) não casam com nenhuma regra e passam intactas.

type Rule = [RegExp, (...groups: string[]) => string];

const RULES: Rule[] = [
  [/^must be a string$/, () => 'deve ser um texto'],
  [/^should not be empty$/, () => 'não pode ser vazio'],
  [/^must be longer than or equal to (\d+) characters$/, (n) => `deve ter pelo menos ${n} caracteres`],
  [/^must be shorter than or equal to (\d+) characters$/, (n) => `deve ter no máximo ${n} caracteres`],
  [/^must be an email$/, () => 'deve ser um e-mail válido'],
  [/^must be one of the following values: (.*)$/, (values) => `deve ser um destes valores: ${values}`],
  [/^must be an integer number$/, () => 'deve ser um número inteiro'],
  [/^must not be less than (.+)$/, (n) => `deve ser maior ou igual a ${n}`],
  [/^must not be greater than (.+)$/, (n) => `deve ser menor ou igual a ${n}`],
  [/^must be a UUID$/, () => 'deve ser um UUID válido'],
  [/^must be a json string$/, () => 'deve ser um JSON válido'],
  [/^must be an object$/, () => 'deve ser um objeto'],
  [/^must be an array$/, () => 'deve ser uma lista'],
  [/^must match (.+) regular expression$/, (pattern) => `deve seguir o padrão ${pattern}`],
  [/^must be a number conforming to the specified constraints$/, () => 'deve ser um número válido'],
  [/^must be a valid ISO 8601 date string$/, () => 'deve ser uma data no formato ISO 8601'],
];

const translateRule = (rest: string): string | undefined => {
  for (const [pattern, build] of RULES) {
    const match = pattern.exec(rest);
    if (match) return build(...match.slice(1));
  }
  return undefined;
};

export function translateValidationMessage(message: string): string {
  // forbidNonWhitelisted: "property x should not exist" (ou "pai.property x ..." em objetos aninhados)
  const notAllowed = /^(?:(\S+)\.)?property (\S+) should not exist$/.exec(message);
  if (notAllowed) {
    const field = notAllowed[1] ? `${notAllowed[1]}.${notAllowed[2]}` : notAllowed[2];
    return `O campo ${field} não é permitido`;
  }

  const nested = /^nested property (\S+) must be either object or array$/.exec(message);
  if (nested) return `O campo ${nested[1]} deve ser um objeto ou uma lista`;

  const each = /^each value in (\S+) (.+)$/.exec(message);
  if (each) {
    const translated = translateRule(each[2]);
    return translated ? `Cada valor do campo ${each[1]} ${translated}` : message;
  }

  const field = /^(\S+) (.+)$/.exec(message);
  const translated = field && translateRule(field[2]);
  return translated ? `O campo ${field[1]} ${translated}` : message;
}
