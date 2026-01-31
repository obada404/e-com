import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductWithFilesDto } from './dto/create-product-with-files.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post()
  @ApiOperation({ 
    summary: 'Create a product with file uploads',
    description: 'Upload product images as files. Images will be uploaded directly to R2 storage.'
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        note: { type: 'string' },
        quantity: { type: 'number' },
        categoryId: { type: 'string' },
        sizes: {
          type: 'string',
          description: 'JSON array of sizes, e.g., [{"size":"S","price":29.99}]',
        },
        colors: {
          type: 'string',
          description: 'JSON array of colors, e.g., [{"color":"Red"},{"color":"Blue"}]',
        },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Product images (max 10 files)',
        },
      },
      required: ['title', 'name', 'quantity', 'categoryId'],
    },
  })
  create(
    @Body() createProductDto: CreateProductWithFilesDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.productsService.create(createProductDto, files);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findOne(id);
  }

  @Post(':id/variants')
  @ApiOperation({ summary: 'Create a variant for a VARIANT_BASED product' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        name: { type: 'string' },
        size: { type: 'string' },
        color: { type: 'string' },
        description: { type: 'string' },
        note: { type: 'string' },
        quantity: { type: 'number' },
        price: { type: 'number' },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
      required: ['title', 'name', 'size', 'quantity', 'price'],
    },
  })
  createVariant(
    @Param('id', ParseUUIDPipe) parentProductId: string,
    @Body() createVariantDto: CreateVariantDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.productsService.createVariant(
      parentProductId,
      createVariantDto,
      files,
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a product' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 10))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        name: { type: 'string' },
        description: { type: 'string' },
        note: { type: 'string' },
        quantity: { type: 'number' },
        categoryId: { type: 'string' },
        sizes: {
          type: 'string',
          description: 'JSON array of sizes, e.g., [{"size":"S","price":29.99}]',
        },
        colors: {
          type: 'string',
          description: 'JSON array of colors, e.g., [{"color":"Red"},{"color":"Blue"}]',
        },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Product images (max 10 files)',
        },
      },
    },
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.productsService.update(id, updateProductDto, files);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a product' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.remove(id);
  }
}



