import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ProductType, ProductRecordType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { ProductTypeService } from '../product-type/product-type.service';
import { CreateProductWithFilesDto } from './dto/create-product-with-files.dto';
import { CreateVariantDto } from './dto/create-variant.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private productTypeService: ProductTypeService,
  ) {}

  /**
   * Create product with file uploads
   * Files will be uploaded directly to R2 storage
   */
  async create(
    createProductDto: CreateProductWithFilesDto,
    files?: Express.Multer.File[],
  ) {
    await this.validateCategory(createProductDto.categoryId);

    const productType = createProductDto.productType ?? ProductType.STANDALONE;

    if (productType === ProductType.STANDALONE) {
      this.productTypeService.validateStandaloneCreate({
        productType,
        recordType: ProductRecordType.BASE_PRODUCT,
        parentProductId: null,
      });
    } else {
      this.productTypeService.validateVariantBasedBaseCreate({
        productType,
        recordType: ProductRecordType.BASE_PRODUCT,
        parentProductId: null,
      });
    }

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

    const { sizes: _, colors: __, productType: _pt, ...productData } = createProductDto;

    return this.createProductInDatabase({
      ...productData,
      sizes,
      colors,
      imageUrls,
      productType,
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
    sizes?: Array<{ size: string; price: number }>;
    colors?: Array<{ color: string }>;
    imageUrls: Array<{ url: string; alt?: string; order: number }>;
    productType?: ProductType;
  }) {
    const sizesData = data.sizes
      ? data.sizes.map((size) => ({
          size: String(size.size),
          price: Number(size.price),
        }))
      : undefined;

    const colorsData = data.colors
      ? data.colors.map((color) => ({
          color: String(color.color),
        }))
      : undefined;

    const productType = data.productType ?? ProductType.STANDALONE;
    const recordType = ProductRecordType.BASE_PRODUCT;

    return this.prisma.product.create({
      data: {
        title: data.title,
        name: data.name,
        description: data.description,
        note: data.note,
        quantity: data.quantity,
        categoryId: data.categoryId,
        productType,
        recordType,
        soldOut: data.quantity === 0,
        sizes: sizesData
          ? {
              create: sizesData,
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
      where: { recordType: ProductRecordType.BASE_PRODUCT },
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
        variants: {
          where: { recordType: ProductRecordType.VARIANT },
          include: {
            images: { orderBy: { order: 'asc' } },
          },
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

    if (productData.productType !== undefined) {
      if (product.parentProductId) {
        throw new BadRequestException(
          'Cannot change productType on a variant record. Update the base product instead.',
        );
      }
      const newProductType = productData.productType;
      const newRecordType = product.recordType;
      await this.productTypeService.validateProductTypeConsistency(
        id,
        newProductType,
        newRecordType,
      );
      updateData.productType = newProductType;
    }

    if (sizes) {
      const sizesData = sizes.map((size: any) => ({
        size: String(size.size),
        price: Number(size.price),
      }));
      updateData.sizes = {
        deleteMany: {},
        create: sizesData,
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

  /**
   * Get or create a variant for a STANDALONE product based on user's size/color selection.
   * Used when adding standalone product to cart.
   */
  async getOrCreateStandaloneVariant(
    baseProductId: string,
    size: string,
    color?: string,
  ) {
    const baseProduct = await this.prisma.product.findUnique({
      where: { id: baseProductId },
      include: { sizes: true, colors: true },
    });

    if (!baseProduct) {
      throw new NotFoundException(
        `Product with ID ${baseProductId} not found`,
      );
    }

    if (baseProduct.productType !== ProductType.STANDALONE) {
      throw new BadRequestException(
        'getOrCreateStandaloneVariant is only for STANDALONE products. Use variant ID directly for VARIANT_BASED products.',
      );
    }

    const productSize = baseProduct.sizes.find((s) => s.size === size);
    if (!productSize) {
      throw new BadRequestException(
        `Size "${size}" is not available for this product`,
      );
    }

    if (color && baseProduct.colors.length > 0) {
      const hasColor = baseProduct.colors.some(
        (c) => c.color.toLowerCase() === color.toLowerCase(),
      );
      if (!hasColor) {
        throw new BadRequestException(
          `Color "${color}" is not available for this product`,
        );
      }
    }

    const colorValue = color || null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let variant = await this.prisma.product.findFirst({
      where: {
        parentProductId: baseProductId,
        recordType: ProductRecordType.VARIANT,
        size,
        color: colorValue,
      } as any,
      include: {
        parentProduct: true,
        category: true,
        images: { orderBy: { order: 'asc' } },
      },
    });

    if (variant) {
      return variant;
    }

    const variantTitle = colorValue
      ? `${baseProduct.title} - ${size} - ${colorValue}`
      : `${baseProduct.title} - ${size}`;
    const variantName = colorValue
      ? `${baseProduct.name}-${size}-${colorValue}`
      : `${baseProduct.name}-${size}`;

    return this.prisma.product.create({
      data: {
        title: variantTitle,
        name: variantName,
        description: baseProduct.description,
        note: baseProduct.note,
        quantity: 0, // Standalone: inventory comes from base product
        price: productSize.price,
        size,
        color: colorValue,
        categoryId: baseProduct.categoryId,
        productType: ProductType.STANDALONE,
        recordType: ProductRecordType.VARIANT,
        parentProductId: baseProductId,
        soldOut: baseProduct.soldOut,
      } as any,
      include: {
        parentProduct: true,
        category: true,
        images: { orderBy: { order: 'asc' } },
      },
    });
  }

  /**
   * Create a variant record for a VARIANT_BASED base product.
   */
  async createVariant(
    parentProductId: string,
    createVariantDto: CreateVariantDto,
    files?: Express.Multer.File[],
  ) {
    const parent = await this.prisma.product.findUnique({
      where: { id: parentProductId },
      include: { category: true },
    });

    if (!parent) {
      throw new NotFoundException(
        `Product with ID ${parentProductId} not found`,
      );
    }

    await this.productTypeService.validateVariantCreate({
      productType: parent.productType,
      recordType: ProductRecordType.VARIANT,
      parentProductId,
    });

    let imageUrls: Array<{ url: string; alt?: string; order: number }> = [];
    if (files && files.length > 0) {
      const uploadedUrls = await this.storageService.uploadFiles(files);
      imageUrls = uploadedUrls.map((url, index) => ({
        url,
        alt: `Variant image ${index + 1}`,
        order: index,
      }));
    }

    return this.prisma.product.create({
      data: {
        title: createVariantDto.title,
        name: createVariantDto.name,
        description: createVariantDto.description,
        note: createVariantDto.note,
        quantity: createVariantDto.quantity,
        price: createVariantDto.price,
        size: createVariantDto.size,
        color: createVariantDto.color ?? null,
        categoryId: parent.categoryId,
        productType: ProductType.VARIANT_BASED,
        recordType: ProductRecordType.VARIANT,
        parentProductId,
        soldOut: createVariantDto.quantity === 0,
        images:
          imageUrls.length > 0
            ? { create: imageUrls }
            : undefined,
      } as any,
      include: {
        category: true,
        parentProduct: true,
        images: { orderBy: { order: 'asc' } },
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

    if (
      product.parentProductId &&
      product.productType === ProductType.VARIANT_BASED
    ) {
      const siblingCount = await this.prisma.product.count({
        where: {
          parentProductId: product.parentProductId,
          recordType: ProductRecordType.VARIANT,
          id: { not: id },
        },
      });
      if (siblingCount === 0) {
        throw new BadRequestException(
          'Cannot delete the last variant. Variant-based products must have at least one variant.',
        );
      }
    }

    return this.prisma.product.delete({
      where: { id },
    });
  }
}

