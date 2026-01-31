import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ProductRecordType, ProductType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProductTypeService } from '../product-type/product-type.service';
import { ProductsService } from '../products/products.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    private prisma: PrismaService,
    private productTypeService: ProductTypeService,
    private productsService: ProductsService,
  ) {}

  async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            mobileNumber: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                category: true,
                parentProduct: true,
                sizes: true,
                colors: true,
                images: {
                  orderBy: { order: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: {
          user: {
            select: {
              mobileNumber: true,
            },
          },
          items: {
            include: {
              product: {
                include: {
                  category: true,
                  sizes: true,
                  colors: true,
                  images: {
                    orderBy: { order: 'asc' },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    let variant = await this.prisma.product.findUnique({
      where: { id: addToCartDto.productId },
      include: {
        sizes: true,
        parentProduct: { include: { sizes: true } },
      },
    });

    if (!variant) {
      throw new NotFoundException(
        `Product with ID ${addToCartDto.productId} not found`,
      );
    }

    if (variant.recordType === ProductRecordType.BASE_PRODUCT) {
      if (variant.productType === ProductType.STANDALONE) {
        if (!addToCartDto.size) {
          throw new BadRequestException(
            'Size is required for standalone products. Select a size to add to cart.',
          );
        }
        variant = (await this.productsService.getOrCreateStandaloneVariant(
          addToCartDto.productId,
          addToCartDto.size,
          addToCartDto.color,
        )) as unknown as typeof variant;
      } else {
        throw new BadRequestException(
          'Variant-based products require a specific variant. Use the variant product ID.',
        );
      }
    }

    this.productTypeService.assertPurchasable({
      id: variant.id,
      productType: variant.productType,
      recordType: variant.recordType,
      parentProductId: variant.parentProductId,
      quantity: variant.quantity,
    });

    const availableQuantity =
      variant.parentProductId && variant.productType === ProductType.STANDALONE
        ? (await this.prisma.product.findUnique({
            where: { id: variant.parentProductId },
            select: { quantity: true },
          }))?.quantity ?? 0
        : variant.quantity;

    if (availableQuantity < addToCartDto.quantity) {
      throw new BadRequestException('Insufficient product quantity');
    }

    const price =
      variant.price ??
      variant.sizes?.[0]?.price ??
      0;

    const cart = await this.getOrCreateCart(userId);

    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: variant.id,
        size: (variant as { size?: string }).size ?? addToCartDto.size ?? null,
      },
    });

    const includeProduct = {
      product: {
        include: {
          category: true,
          parentProduct: true,
          sizes: true,
          colors: true,
          images: { orderBy: { order: 'asc' as const }, take: 1 },
        },
      },
    };

    if (existingItem) {
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + addToCartDto.quantity,
        },
        include: includeProduct,
      });
    }

    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: variant.id,
        size: (variant as { size?: string }).size ?? addToCartDto.size ?? null,
        quantity: addToCartDto.quantity,
        price,
      },
      include: includeProduct,
    });
  }

  async updateCartItem(
    userId: string,
    itemId: string,
    updateCartItemDto: UpdateCartItemDto,
  ) {
    const cart = await this.getOrCreateCart(userId);

    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
      include: {
        product: {
          include: { parentProduct: true },
        },
      },
    });

    if (!item) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found`);
    }

    const availableQty =
      item.product.parentProductId && item.product.productType === ProductType.STANDALONE
        ? (item.product.parentProduct?.quantity ?? 0)
        : item.product.quantity;

    if (availableQty < updateCartItemDto.quantity) {
      throw new BadRequestException('Insufficient product quantity');
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity: updateCartItemDto.quantity,
      },
      include: {
        product: {
          include: {
            category: true,
            parentProduct: true,
            sizes: true,
            colors: true,
            images: {
              orderBy: { order: 'asc' },
              take: 1,
            },
          },
        },
      },
    });
  }

  async removeFromCart(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);

    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!item) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found`);
    }

    return this.prisma.cartItem.delete({
      where: { id: itemId },
    });
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    return this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }

  // Admin methods
  async getCartById(cartId: string) {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            mobileNumber: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                category: true,
                parentProduct: true,
                sizes: true,
                colors: true,
                images: {
                  orderBy: { order: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      throw new NotFoundException(`Cart with ID ${cartId} not found`);
    }

    return cart;
  }

  async getAllCarts() {
    return this.prisma.cart.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            mobileNumber: true,
          },
        },
        items: {
          include: {
            product: {
              include: {
                category: true,
                parentProduct: true,
                sizes: true,
                colors: true,
                images: {
                  orderBy: { order: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}

