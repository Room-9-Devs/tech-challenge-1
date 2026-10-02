import { PasswordHasher } from '@/application/ports/password-hasher.port';

export class FakePasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> { return `hash:${password}`; }
  async compare(password: string, encodedHash: string): Promise<boolean> { return encodedHash === `hash:${password}`; }
}
