import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderFromCartDto } from './dto/create-order-from-cart.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createOrderFromCart(createOrderDto: CreateOrderFromCartDto) {
    // Get cart with items and user
    const cart = await this.prisma.cart.findUnique({
      where: { id: createOrderDto.cartId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!cart) {
      throw new NotFoundException(`Cart with ID ${createOrderDto.cartId} not found`);
    }

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty. Cannot create order from empty cart.');
    }

    // Calculate total amount
    const totalAmount = cart.items.reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);

    // Create order with items
    const order = await this.prisma.order.create({
      data: {
        userId: cart.userId,
        cartId: cart.id,
        totalAmount,
        status: 'pending',
        items: {
          create: cart.items.map((item) => ({
            productId: item.productId,
            size: item.size,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
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

    return order;
  }

  async findAll() {
    return this.prisma.order.findMany({
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
                images: {
                  orderBy: { order: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
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

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return order;
  }

  async findByUserId(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                images: {
                  orderBy: { order: 'asc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
