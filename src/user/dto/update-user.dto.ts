import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsBase64, IsOptional } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['name']),
) {
  @IsBase64()
  @IsOptional()
  vaultKey?: string;

  @IsBase64()
  @IsOptional()
  data?: string;
}
