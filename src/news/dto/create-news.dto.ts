import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsUrl,
    IsBoolean,
    IsInt,
    Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateNewsDto {
    @ApiProperty({ example: 'New Collection Arrived!' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({
        example: 'Check out our latest collection of products',
        required: false,
    })
    @IsString()
    @IsOptional()
    content?: string;

    @ApiProperty({
        example: 'https://example.com/news/collection-2024',
        required: false,
    })
    @IsUrl()
    @IsOptional()
    link?: string;

    @ApiProperty({ example: true, required: false, default: true })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @ApiProperty({ example: 0, required: false, default: 0 })
    @IsInt()
    @Min(0)
    @IsOptional()
    order?: number;
}
