import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

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
    const product = await this.prisma.product.findUnique({
      where: { id: addToCartDto.productId },
      include: {
        sizes: true,
      },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID ${addToCartDto.productId} not found`,
      );
    }

    if (product.quantity < addToCartDto.quantity) {
      throw new BadRequestException('Insufficient product quantity');
    }

    let price = 0;
    if (addToCartDto.size) {
      const productSize = product.sizes.find(
        (s) => s.size === addToCartDto.size,
      );
      if (!productSize) {
        throw new NotFoundException(
          `Size ${addToCartDto.size} not available for this product`,
        );
      }
      price = productSize.price;
    } else {
      if (product.sizes.length > 0) {
        price = product.sizes[0].price;
      }
    }

    const cart = await this.getOrCreateCart(userId);

    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: addToCartDto.productId,
        size: addToCartDto.size || null,
      },
    });

    if (existingItem) {
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + addToCartDto.quantity,
        },
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
      });
    }

    return this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: addToCartDto.productId,
        size: addToCartDto.size || null,
        quantity: addToCartDto.quantity,
        price,
      },
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
        product: true,
      },
    });

    if (!item) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found`);
    }

    if (item.product.quantity < updateCartItemDto.quantity) {
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

