import { IsUUID, IsString, IsInt, IsNotEmpty, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ example: 'product-uuid' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 'M', description: 'Required for standalone products', required: false })
  @IsString()
  @IsOptional()
  size?: string;

  @ApiProperty({ example: 'Red', description: 'Optional; used with standalone when product has colors', required: false })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}



