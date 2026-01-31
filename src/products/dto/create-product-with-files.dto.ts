import {
  IsString,
  IsUUID,
  IsNotEmpty,
  Min,
  IsOptional,
  IsInt,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductType } from '@prisma/client';

export class CreateProductWithFilesDto {
  @ApiProperty({ example: 'Premium Laptop Computer' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'laptop' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'High-performance laptop with latest technology',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Available in multiple colors', required: false })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(0)
  quantity: number;

  @ApiProperty({ example: 'uuid-of-category' })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({
    type: 'string',
    description: 'JSON array of sizes, e.g., [{"size":"S","price":29.99}]',
    required: false,
  })
  @IsString()
  @IsOptional()
  sizes?: string;

  @ApiProperty({
    type: 'string',
    description: 'JSON array of colors, e.g., [{"color":"Red"}]',
    required: false,
  })
  @IsString()
  @IsOptional()
  colors?: string;

  @ApiProperty({
    enum: ProductType,
    description: 'Product type: STANDALONE (default, directly purchasable) or VARIANT_BASED (base + variants)',
    required: false,
  })
  @IsEnum(ProductType)
  @IsOptional()
  productType?: ProductType;
}
