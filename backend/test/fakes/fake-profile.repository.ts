import {
  ClientProfileInput,
  EmployeeProfileInput,
  ProfileRecord,
  ProfileRepository,
} from '@/application/ports/profile.repository';
import { UserEntityType } from '@/domain/entities/user.entity';
import { randomUUID } from 'crypto';

export class FakeProfileRepository implements ProfileRepository {
  private profiles: ProfileRecord[] = [];

  async createClient(input: ClientProfileInput): Promise<ProfileRecord> {
    const profile: ProfileRecord = {
      ...input,
      id: input.id ?? randomUUID(),
      type: 'client',
    };
    this.profiles.push(profile);
    return profile;
  }

  async createEmployee(input: EmployeeProfileInput): Promise<ProfileRecord> {
    const profile: ProfileRecord = {
      ...input,
      id: input.id ?? randomUUID(),
      type: 'employee',
    };
    this.profiles.push(profile);
    return profile;
  }

  async findById(
    type: UserEntityType,
    id: string,
  ): Promise<ProfileRecord | null> {
    const profile = this.profiles.find(
      (candidate) => candidate.type === type && candidate.id === id,
    );
    return profile ? { ...profile } : null;
  }

  async update(
    type: UserEntityType,
    id: string,
    data: Partial<Pick<ProfileRecord, 'name' | 'phone' | 'jobTitle'>>,
  ): Promise<ProfileRecord | null> {
    const profile = this.profiles.find(
      (candidate) => candidate.type === type && candidate.id === id,
    );
    if (!profile) return null;

    if (data.name !== undefined) profile.name = data.name;
    if (data.phone !== undefined) profile.phone = data.phone;
    if (type === 'employee' && data.jobTitle !== undefined) {
      profile.jobTitle = data.jobTitle;
    }

    return { ...profile };
  }

  snapshot(): ProfileRecord[] {
    return this.profiles.map((profile) => ({ ...profile }));
  }
  restore(profiles: ProfileRecord[]): void {
    this.profiles = profiles.map((profile) => ({ ...profile }));
  }
}
