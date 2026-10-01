import { ClientProfileInput, EmployeeProfileInput, ProfileRecord, ProfileRepository } from '@/application/ports/profile.repository';
import { UserEntityType } from '@/domain/entities/user.entity';
import { randomUUID } from 'crypto';

export class FakeProfileRepository implements ProfileRepository {
  private profiles: ProfileRecord[] = [];

  async createClient(input: ClientProfileInput): Promise<ProfileRecord> {
    const profile: ProfileRecord = { ...input, id: randomUUID(), type: 'client' };
    this.profiles.push(profile);
    return profile;
  }

  async createEmployee(input: EmployeeProfileInput): Promise<ProfileRecord> {
    const profile: ProfileRecord = { ...input, id: randomUUID(), type: 'employee' };
    this.profiles.push(profile);
    return profile;
  }

  async findById(type: UserEntityType, id: string): Promise<ProfileRecord | null> {
    return this.profiles.find((profile) => profile.type === type && profile.id === id) || null;
  }
}
