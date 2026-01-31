import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginByMobileDto {
  @ApiProperty({ example: '+970599504676 or 0599504676' })
  @IsString()
  @IsNotEmpty()
  mobileNumber: string;
}
