import {
  IsString,
  IsNotEmpty,
  Min,
  IsOptional,
  IsInt,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVariantDto {
  @ApiProperty({ example: 'Red - Large' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'red-large' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity: number;

  @ApiProperty({ example: 'M' })
  @IsString()
  @IsNotEmpty()
  size: string;

  @ApiProperty({ example: 'Red', required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ example: 39.99 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 'Red, Large', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Available', required: false })
  @IsString()
  @IsOptional()
  note?: string;
}
