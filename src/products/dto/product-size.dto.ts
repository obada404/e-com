import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProductSizeDto {
  @ApiProperty({ example: 'S' })
  @IsString()
  @IsNotEmpty()
  size: string;

  @ApiProperty({ example: 39.99 })
  @IsNumber()
  @Min(0)
  priceBeforeDiscount: number;

  @ApiProperty({ example: 29.99 })
  @IsNumber()
  @Min(0)
  priceAfterDiscount: number;
}



