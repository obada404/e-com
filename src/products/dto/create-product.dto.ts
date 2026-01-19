import {
  IsString,
  IsNumber,
  IsUUID,
  IsNotEmpty,
  Min,
  IsOptional,
  IsArray,
  ValidateNested,
  IsInt,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProductSizeDto } from './product-size.dto';
import { ProductImageDto } from './product-image.dto';
import { ProductColorDto } from './product-color.dto';

export class CreateProductDto {
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
    type: [ProductSizeDto],
    example: [
      { size: 'S', price: 29.99 },
      { size: 'M', price: 34.99 },
      { size: 'L', price: 39.99 },
    ],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductSizeDto)
  @IsOptional()
  sizes?: ProductSizeDto[];

  @ApiProperty({
    type: [ProductImageDto],
    example: [
      { url: 'https://example.com/image1.jpg', alt: 'Product front', order: 0 },
      { url: 'https://example.com/image2.jpg', alt: 'Product back', order: 1 },
    ],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  @IsOptional()
  images?: ProductImageDto[];

  @ApiProperty({
    type: [ProductColorDto],
    example: [
      { color: 'Red' },
      { color: 'Blue' },
      { color: 'Green' },
    ],
    required: false,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductColorDto)
  @IsOptional()
  colors?: ProductColorDto[];
}

