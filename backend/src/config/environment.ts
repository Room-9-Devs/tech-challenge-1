import { config } from 'dotenv';
import { resolve } from 'path';

export const ENV_FILE_PATH = resolve(__dirname, '../../.env');

export function loadEnvironment(): void {
  config({ path: ENV_FILE_PATH });
}