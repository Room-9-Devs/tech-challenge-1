import { requireEnvironmentVariable } from '@/config/environment';

describe('requireEnvironmentVariable', () => {
  const variableName = 'SPEC_REQUIRED_VARIABLE';
  const originalValue = process.env[variableName];

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env[variableName];
    } else {
      process.env[variableName] = originalValue;
    }
  });

  it('returns the variable value when it is defined', () => {
    process.env[variableName] = 'defined-value';
    expect(requireEnvironmentVariable(variableName)).toBe('defined-value');
  });

  it('throws when the variable is not defined', () => {
    delete process.env[variableName];
    expect(() => requireEnvironmentVariable(variableName)).toThrow(
      `Missing required environment variable: ${variableName}`,
    );
  });

  it('throws when the variable is empty', () => {
    process.env[variableName] = '';
    expect(() => requireEnvironmentVariable(variableName)).toThrow(
      `Missing required environment variable: ${variableName}`,
    );
  });
});
