import { PartialType } from '@nestjs/swagger';
import { CreateProductWithFilesDto } from './create-product-with-files.dto';

export class UpdateProductDto extends PartialType(CreateProductWithFilesDto) {}



