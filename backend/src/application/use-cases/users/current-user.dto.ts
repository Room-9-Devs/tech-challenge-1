export interface CurrentUser {
  id: string;
  username: string;
  role: string;
  entityType: 'client' | 'employee';
}
