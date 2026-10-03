import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import { PasswordHasher } from '@/application/ports/password-hasher.port';

const scrypt = promisify(scryptCallback);

@Injectable()
export class ScryptPasswordHasherService implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    return `scrypt$${salt}$${derivedKey.toString('hex')}`;
  }

  async compare(password: string, encodedHash: string): Promise<boolean> {
    const [algorithm, salt, hash] = encodedHash.split('$');
    if (algorithm !== 'scrypt' || !salt || !hash) return false;
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    const expected = Buffer.from(hash, 'hex');
    return expected.length === derivedKey.length && timingSafeEqual(expected, derivedKey);
  }
}
