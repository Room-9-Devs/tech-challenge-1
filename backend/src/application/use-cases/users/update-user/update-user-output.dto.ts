export interface UpdateUserOutputDto {
  id: string;
  username: string;
  email: string;
  entityType: 'client' | 'employee';
  entityId: string;
  role: string;
  profile: object;
  createdAt: Date;
  updatedAt: Date;
}
