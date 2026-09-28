export interface ListUsersOutputDto {
  users: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  }[];
}
