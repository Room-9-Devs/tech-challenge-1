import { readFileSync } from 'fs';
import { join } from 'path';

// Copiado para o dist pelo "assets" do nest-cli.json
const LOGO_PATH = join(__dirname, 'assets', 'logo.png');

let logo: Buffer | undefined;

export function readBrandLogo(): Buffer {
  logo ??= readFileSync(LOGO_PATH);
  return logo;
}
