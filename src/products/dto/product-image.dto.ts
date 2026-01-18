import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProductImageDto {
  @ApiProperty({ example: 'https://example.com/image.jpg' })
  @IsString()
  url: string;

  @ApiProperty({ example: 'Product image', required: false })
  @IsString()
  @IsOptional()
  alt?: string;

  @ApiProperty({ example: 0, required: false })
  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}



