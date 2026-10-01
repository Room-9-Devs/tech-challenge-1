export interface CreateUserOutputDto {
  id: string;
  username: string;
  email: string;
  entityType: 'client' | 'employee';
  entityId: string;
  role: string;
  profile: {
    id: string;
    name: string;
    phone: string;
    documentType?: 'CPF' | 'CNPJ';
    document?: string;
    jobTitle?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
