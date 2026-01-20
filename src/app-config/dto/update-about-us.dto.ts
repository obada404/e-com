import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAboutUsDto {
    @ApiProperty({
        example: 'We are a leading e-commerce platform...',
        required: false,
        description: 'About Us page content',
    })
    @IsString()
    @IsOptional()
    aboutUs?: string;
}
