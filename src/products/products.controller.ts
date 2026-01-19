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
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a product' })
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
          description: 'Product images (max 10)',
        },
      },
      required: ['title', 'name', 'quantity', 'categoryId'],
    },
  })
  create(
    @Body() createProductDto: CreateProductDto,
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
          description: 'Product images (max 10)',
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



