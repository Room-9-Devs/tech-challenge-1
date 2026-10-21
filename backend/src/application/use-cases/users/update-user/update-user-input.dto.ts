export interface UpdateUserProfileInputDto {
  name?: string;
  phone?: string;
  jobTitle?: string;
}

export interface UpdateUserInputDto {
  username?: string;
  email?: string;
  profile?: UpdateUserProfileInputDto;
}
