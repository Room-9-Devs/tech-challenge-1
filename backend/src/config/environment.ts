import { config } from 'dotenv';
import { resolve } from 'path';

export const ENV_FILE_PATH = resolve(__dirname, '../../.env');

export function loadEnvironment(): void {
  config({ path: ENV_FILE_PATH });
}

export function requireEnvironmentVariable(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Define it before starting the application.`,
    );
  }
  return value;
}