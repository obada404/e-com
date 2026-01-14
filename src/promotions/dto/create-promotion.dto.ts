import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsUrl,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePromotionDto {
  @ApiProperty({ example: 'Summer Sale 2024' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'https://example.com/promotion-banner.jpg' })
  @IsUrl()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty({
    example: 'Get up to 50% off on all summer items',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2024-06-01T00:00:00Z' })
  @IsDateString()
  @IsNotEmpty()
  appearanceDate: string;

  @ApiProperty({ example: '2024-08-31T23:59:59Z' })
  @IsDateString()
  @IsNotEmpty()
  closeDate: string;
}


