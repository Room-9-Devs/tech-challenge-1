import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ChangeRoleRequestDto {
  @ApiProperty({ description: 'Slug do novo role.', example: 'staff' })
  @IsString()
  @IsNotEmpty()
  role: string;
}
