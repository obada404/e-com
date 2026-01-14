import { IsUUID, IsString, IsInt, IsNotEmpty, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'M', required: false })
  @IsString()
  size?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}


