import { IsEmail, IsOptional, IsString } from 'class-validator';

export class FindOneUserDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}
