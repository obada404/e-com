import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) { }

  async create(
    createProductDto: CreateProductDto,
    files?: Express.Multer.File[],
  ) {
    const category = await this.prisma.category.findUnique({
      where: { id: createProductDto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `Category with ID ${createProductDto.categoryId} not found`,
      );
    }

    // Parse sizes if it's a string (from multipart/form-data)
    let sizes = createProductDto.sizes;
    if (typeof sizes === 'string') {
      try {
        sizes = JSON.parse(sizes);
      } catch (error) {
        throw new Error('Invalid sizes format. Expected JSON array.');
      }
    }

    const { images, ...productData } = createProductDto;

    // Upload files to R2 if provided
    let imageUrls: Array<{ url: string; alt?: string; order: number }> = [];
    if (files && files.length > 0) {
      const uploadedUrls = await this.storageService.uploadFiles(files);
      imageUrls = uploadedUrls.map((url, index) => ({
        url,
        alt: `Product image ${index + 1}`,
        order: index,
      }));
    } else if (images && images.length > 0) {
      // Fallback to provided URLs if no files uploaded
      imageUrls = images.map((img, index) => ({
        url: img.url,
        alt: img.alt || `Product image ${index + 1}`,
        order: img.order ?? index,
      }));
    }

    return this.prisma.product.create({
      data: {
        title: productData.title,
        name: productData.name,
        description: productData.description,
        note: productData.note,
        quantity: productData.quantity,
        categoryId: productData.categoryId,
        soldOut: productData.quantity === 0,
        sizes: sizes
          ? {
            create: sizes,
          }
          : undefined,
        images: imageUrls.length > 0
          ? {
            create: imageUrls,
          }
          : undefined,
      } as any,
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

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    files?: Express.Multer.File[],
  ) {
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

    // Parse sizes if it's a string (from multipart/form-data)
    let sizes = updateProductDto.sizes;
    if (sizes && typeof sizes === 'string') {
      try {
        sizes = JSON.parse(sizes);
      } catch (error) {
        throw new Error('Invalid sizes format. Expected JSON array.');
      }
    }

    const { images, ...productData } = updateProductDto;

    // Upload files to R2 if provided
    let imageUrls: Array<{ url: string; alt?: string; order: number }> | undefined;
    if (files && files.length > 0) {
      const uploadedUrls = await this.storageService.uploadFiles(files);
      imageUrls = uploadedUrls.map((url, index) => ({
        url,
        alt: `Product image ${index + 1}`,
        order: index,
      }));
    } else if (images && images.length > 0) {
      // Fallback to provided URLs if no files uploaded
      imageUrls = images.map((img, index) => ({
        url: img.url,
        alt: img.alt || `Product image ${index + 1}`,
        order: img.order ?? index,
      }));
    }

    // Determine if product should be marked as sold out
    const newQuantity =
      productData.quantity !== undefined
        ? productData.quantity
        : product.quantity;
    const soldOut = newQuantity === 0;

    const updateData: any = {
      soldOut,
    };

    // Only include fields that are being updated
    if (productData.title !== undefined) updateData.title = productData.title;
    if (productData.name !== undefined) updateData.name = productData.name;
    if (productData.description !== undefined) updateData.description = productData.description;
    if (productData.note !== undefined) updateData.note = productData.note;
    if (productData.quantity !== undefined) updateData.quantity = productData.quantity;
    if (productData.categoryId !== undefined) updateData.categoryId = productData.categoryId;

    if (sizes) {
      updateData.sizes = {
        deleteMany: {},
        create: sizes,
      };
    }

    if (imageUrls) {
      updateData.images = {
        deleteMany: {},
        create: imageUrls,
      };
    }

    return this.prisma.product.update({
      where: { id },
      data: updateData,
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

