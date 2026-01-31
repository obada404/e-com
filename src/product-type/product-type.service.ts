import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductType, ProductRecordType } from '@prisma/client';

/** Product record as returned by Prisma (minimal shape for validation) */
export interface ProductRecord {
  id: string;
  productType: ProductType;
  recordType: ProductRecordType;
  parentProductId: string | null;
  quantity: number;
}

/**
 * Centralized product-type logic.
 * Enforces consistency between productType enum and record types.
 * Extensible for future product types.
 */
@Injectable()
export class ProductTypeService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if a product record is directly purchasable (can be added to cart).
   * - Both Standalone and Variant-based: only VARIANT records are purchasable.
   * - Base products are templates; user must select size/color to get a variant.
   */
  isPurchasable(product: ProductRecord): boolean {
    return product.recordType === ProductRecordType.VARIANT;
  }

  /**
   * Assert that a product is purchasable; throws if not.
   */
  assertPurchasable(product: ProductRecord): void {
    if (!this.isPurchasable(product)) {
      throw new BadRequestException(
        'Only variants can be added to cart. For standalone products, select size (and color) to create a variant. For variant-based products, select a specific variant.',
      );
    }
  }

  /**
   * Validate consistency for creating a STANDALONE product.
   * - Must be BASE_PRODUCT
   * - parentProductId must be null
   */
  validateStandaloneCreate(data: {
    productType?: ProductType;
    recordType?: ProductRecordType;
    parentProductId?: string | null;
  }): void {
    const productType = data.productType ?? ProductType.STANDALONE;
    const recordType = data.recordType ?? ProductRecordType.BASE_PRODUCT;

    if (productType !== ProductType.STANDALONE) {
      throw new BadRequestException(
        'Standalone product must have productType STANDALONE',
      );
    }
    if (recordType !== ProductRecordType.BASE_PRODUCT) {
      throw new BadRequestException(
        'Standalone product must have recordType BASE_PRODUCT',
      );
    }
    if (data.parentProductId != null) {
      throw new BadRequestException(
        'Standalone product cannot have parentProductId',
      );
    }
  }

  /**
   * Validate consistency for creating a VARIANT_BASED base product.
   * - Must be BASE_PRODUCT
   * - parentProductId must be null
   */
  validateVariantBasedBaseCreate(data: {
    productType: ProductType;
    recordType?: ProductRecordType;
    parentProductId?: string | null;
  }): void {
    if (data.productType !== ProductType.VARIANT_BASED) {
      throw new BadRequestException(
        'Variant-based base must have productType VARIANT_BASED',
      );
    }
    const recordType = data.recordType ?? ProductRecordType.BASE_PRODUCT;
    if (recordType !== ProductRecordType.BASE_PRODUCT) {
      throw new BadRequestException(
        'Variant-based base product must have recordType BASE_PRODUCT',
      );
    }
    if (data.parentProductId != null) {
      throw new BadRequestException(
        'Base product cannot have parentProductId',
      );
    }
  }

  /**
   * Validate consistency for creating a VARIANT record.
   * - Must be VARIANT recordType
   * - parentProductId must reference a valid VARIANT_BASED base product
   */
  async validateVariantCreate(data: {
    productType: ProductType;
    recordType: ProductRecordType;
    parentProductId: string;
  }): Promise<void> {
    if (data.productType !== ProductType.VARIANT_BASED) {
      throw new BadRequestException(
        'Variant record must belong to a VARIANT_BASED product',
      );
    }
    if (data.recordType !== ProductRecordType.VARIANT) {
      throw new BadRequestException(
        'Variant record must have recordType VARIANT',
      );
    }
    if (!data.parentProductId) {
      throw new BadRequestException('Variant must have parentProductId');
    }

    const parent = await this.prisma.product.findUnique({
      where: { id: data.parentProductId },
      select: { productType: true, recordType: true },
    });

    if (!parent) {
      throw new BadRequestException('Parent product not found');
    }
    if (parent.productType !== ProductType.VARIANT_BASED) {
      throw new BadRequestException(
        'Parent product must be VARIANT_BASED to add variants',
      );
    }
    if (parent.recordType !== ProductRecordType.BASE_PRODUCT) {
      throw new BadRequestException(
        'Parent product must be BASE_PRODUCT (cannot nest variants)',
      );
    }
  }

  /**
   * Validate that a STANDALONE product has no variant records.
   * Call before/after updates that could introduce inconsistency.
   */
  async assertNoVariantsForStandalone(productId: string): Promise<void> {
    const count = await this.prisma.product.count({
      where: {
        parentProductId: productId,
        recordType: ProductRecordType.VARIANT,
      },
    });
    if (count > 0) {
      throw new ConflictException(
        'Standalone products cannot have variant records. Remove variants or change product type.',
      );
    }
  }

  /**
   * Validate that a VARIANT_BASED base product has at least one variant.
   * Call when enforcing "one or more variant records must exist".
   * Use before operations that would leave base with zero variants (e.g. last variant delete).
   */
  async assertHasVariants(productId: string): Promise<void> {
    const count = await this.prisma.product.count({
      where: {
        parentProductId: productId,
        recordType: ProductRecordType.VARIANT,
      },
    });
    if (count === 0) {
      throw new BadRequestException(
        'Variant-based product must have at least one variant before it can be used.',
      );
    }
  }

  /**
   * Ensure productType and recordType are consistent.
   * Used when updating productType or recordType.
   */
  async validateProductTypeConsistency(
    productId: string,
    newProductType: ProductType,
    newRecordType: ProductRecordType,
  ): Promise<void> {
    if (newProductType === ProductType.STANDALONE) {
      if (newRecordType !== ProductRecordType.BASE_PRODUCT) {
        throw new BadRequestException(
          'Standalone product must have recordType BASE_PRODUCT',
        );
      }
      await this.assertNoVariantsForStandalone(productId);
    }

    if (newProductType === ProductType.VARIANT_BASED) {
      if (newRecordType === ProductRecordType.BASE_PRODUCT) {
        // Base can exist without variants during creation; validation on publish/use
      }
      if (newRecordType === ProductRecordType.VARIANT) {
        const product = await this.prisma.product.findUnique({
          where: { id: productId },
        });
        if (product?.parentProductId) {
          await this.validateVariantCreate({
            productType: newProductType,
            recordType: newRecordType,
            parentProductId: product.parentProductId,
          });
        }
      }
    }
  }

  /**
   * Get the default productType and recordType for new products (backward compatibility).
   * Legacy: STANDALONE + BASE_PRODUCT.
   */
  getDefaults(): { productType: ProductType; recordType: ProductRecordType } {
    return {
      productType: ProductType.STANDALONE,
      recordType: ProductRecordType.BASE_PRODUCT,
    };
  }
}
