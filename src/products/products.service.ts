import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateProductWithFilesDto } from './dto/create-product-with-files.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
  ) { }

  /**
   * Create product with file uploads
   * Files will be uploaded directly to R2 storage
   */
  async create(
    createProductDto: CreateProductWithFilesDto,
    files?: Express.Multer.File[],
  ) {
    await this.validateCategory(createProductDto.categoryId);

    // Parse JSON strings from form-data
    const sizes = this.parseJsonField(createProductDto.sizes);
    const colors = this.parseJsonField(createProductDto.colors);

    // Upload files directly to R2
    let imageUrls: Array<{ url: string; alt?: string; order: number }> = [];
    if (files && files.length > 0) {
      const uploadedUrls = await this.storageService.uploadFiles(files);
      imageUrls = uploadedUrls.map((url, index) => ({
        url,
        alt: `Product image ${index + 1}`,
        order: index,
      }));
    }

    const { sizes: _, colors: __, ...productData } = createProductDto;

    return this.createProductInDatabase({
      ...productData,
      sizes,
      colors,
      imageUrls,
    });
  }

  /**
   * Validate category exists
   */
  private async validateCategory(categoryId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `Category with ID ${categoryId} not found`,
      );
    }
  }

  /**
   * Parse JSON string field from form-data
   */
  private parseJsonField(field?: string): any {
    if (!field) return undefined;
    try {
      return JSON.parse(field);
    } catch {
      throw new Error(`Invalid JSON format for field`);
    }
  }

  /**
   * Create product in database with all related data
   */
  private async createProductInDatabase(data: {
    title: string;
    name: string;
    description?: string;
    note?: string;
    quantity: number;
    categoryId: string;
    sizes?: Array<{
      size: string;
      priceBeforeDiscount: number;
      priceAfterDiscount: number;
    }>;
    colors?: Array<{ color: string }>;
    imageUrls: Array<{ url: string; alt?: string; order: number }>;
  }) {
    const sizesData = data.sizes
      ? data.sizes.map((size) => ({
          size: String(size.size),
          priceBeforeDiscount: Number(size.priceBeforeDiscount),
          priceAfterDiscount: Number(size.priceAfterDiscount),
        }))
      : undefined;

    const colorsData = data.colors
      ? data.colors.map((color) => ({
          color: String(color.color),
        }))
      : undefined;

    return this.prisma.product.create({
      data: {
        title: data.title,
        name: data.name,
        description: data.description,
        note: data.note,
        quantity: data.quantity,
        categoryId: data.categoryId,
        soldOut: data.quantity === 0,
        sizes: sizesData
          ? {
              create: sizesData as any,
            }
          : undefined,
        colors: colorsData
          ? {
              create: colorsData,
            }
          : undefined,
        images: data.imageUrls.length > 0
          ? {
              create: data.imageUrls,
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
        colors: true,
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

    // Parse JSON strings from form-data
    const sizes = updateProductDto.sizes
      ? this.parseJsonField(updateProductDto.sizes)
      : undefined;
    const colors = updateProductDto.colors
      ? this.parseJsonField(updateProductDto.colors)
      : undefined;

    const { sizes: _, colors: __, ...productData } = updateProductDto;

    // When new files are provided: replace all images (delete from DB + R2, then upload new)
    let newImages: Array<{ url: string; alt?: string; order: number }> | undefined;
    if (files && files.length > 0) {
      const existingImages = await this.prisma.productImage.findMany({
        where: { productId: id },
        select: { url: true },
      });
      const existingUrls = existingImages.map((img) => img.url);
      await this.prisma.productImage.deleteMany({ where: { productId: id } });
      if (existingUrls.length > 0) {
        await this.storageService.deleteByUrls(existingUrls);
      }
      const uploadedUrls = await this.storageService.uploadFiles(files);
      newImages = uploadedUrls.map((url, index) => ({
        url,
        alt: `Product image ${index + 1}`,
        order: index,
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
      const sizesData = sizes.map((size: any) => ({
        size: String(size.size),
        priceBeforeDiscount: Number(size.priceBeforeDiscount),
        priceAfterDiscount: Number(size.priceAfterDiscount),
      }));
      updateData.sizes = {
        deleteMany: {},
        create: sizesData as any,
      };
    }

    if (colors) {
      const colorsData = colors.map((color: any) => ({
        color: String(color.color),
      }));
      updateData.colors = {
        deleteMany: {},
        create: colorsData,
      };
    }

    if (newImages) {
      updateData.images = {
        create: newImages,
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

