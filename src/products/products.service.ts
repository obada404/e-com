import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: createProductDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `Category with ID ${createProductDto.categoryId} not found`,
      );
    }

    const { sizes, images, ...productData } = createProductDto;

    return this.prisma.product.create({
      data: {
        ...productData,
        sizes: sizes
          ? {
              create: sizes,
            }
          : undefined,
        images: images
          ? {
              create: images,
            }
          : undefined,
      },
      include: {
        category: true,
        sizes: {
          orderBy: { size: 'asc' },
        },
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: {
        category: true,
        sizes: {
          orderBy: { size: 'asc' },
        },
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        sizes: {
          orderBy: { size: 'asc' },
        },
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    if (updateProductDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateProductDto.categoryId },
      });

      if (!category) {
        throw new NotFoundException(
          `Category with ID ${updateProductDto.categoryId} not found`,
        );
      }
    }

    const { sizes, images, ...productData } = updateProductDto;

    return this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        sizes: sizes
          ? {
              deleteMany: {},
              create: sizes,
            }
          : undefined,
        images: images
          ? {
              deleteMany: {},
              create: images,
            }
          : undefined,
      },
      include: {
        category: true,
        sizes: {
          orderBy: { size: 'asc' },
        },
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async remove(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return this.prisma.product.delete({
      where: { id },
    });
  }
}

