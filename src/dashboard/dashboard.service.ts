import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(): Promise<DashboardStatsDto> {
    const [
      totalUsers,
      totalProducts,
      totalCategories,
      totalPromotions,
      activePromotions,
      totalAdmins,
      totalCarts,
      productsByCategory,
      recentUsers,
      recentProducts,
      lowStockProducts,
      cartStats,
    ] = await Promise.all([
      // Count users
      this.prisma.user.count(),
      
      // Count products
      this.prisma.product.count(),
      
      // Count categories
      this.prisma.category.count(),
      
      // Count total promotions
      this.prisma.promotion.count(),
      
      // Count active promotions
      this.prisma.promotion.count({
        where: { isActive: true },
      }),
      
      // Count admin users
      this.prisma.user.count({
        where: { role: 'ADMIN' },
      }),
      
      // Count active carts
      this.prisma.cart.count(),
      
      // Products by category
      this.prisma.category.findMany({
        select: {
          name: true,
          _count: {
            select: { products: true },
          },
        },
      }),
      
      // Recent users (last 7 days)
      this.prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // Recent products (last 7 days)
      this.prisma.product.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      
      // Low stock products (quantity <= 10)
      this.prisma.product.count({
        where: {
          quantity: {
            lte: 10,
          },
        },
      }),
      
      // Cart statistics
      this.getCartAggregates(),
    ]);

    const totalRegularUsers = totalUsers - totalAdmins;

    return {
      overview: {
        totalUsers,
        totalRegularUsers,
        totalAdmins,
        totalProducts,
        totalCategories,
        totalPromotions,
        activePromotions,
        totalCarts,
      },
      products: {
        totalProducts,
        recentProducts,
        lowStockProducts,
        byCategory: productsByCategory.map((cat) => ({
          categoryName: cat.name,
          productCount: cat._count.products,
        })),
      },
      users: {
        totalUsers,
        recentUsers,
        totalAdmins,
        totalRegularUsers,
      },
      cart: cartStats,
    };
  }

  async getOverviewCounts() {
    const [usersCount, productsCount, categoriesCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.product.count(),
      this.prisma.category.count(),
    ]);

    return {
      users: usersCount,
      products: productsCount,
      categories: categoriesCount,
    };
  }

  async getProductsByCategory() {
    const categories = await this.prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      productCount: category._count.products,
      createdAt: category.createdAt,
    }));
  }

  async getRecentActivity() {
    const [recentUsers, recentProducts, recentPromotions] = await Promise.all([
      this.prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
      this.prisma.product.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          title: true,
          quantity: true,
          category: {
            select: {
              name: true,
            },
          },
          createdAt: true,
        },
      }),
      this.prisma.promotion.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          isActive: true,
          appearanceDate: true,
          closeDate: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      recentUsers,
      recentProducts,
      recentPromotions,
    };
  }

  async getCartStatistics() {
    return this.getCartAggregates();
  }

  private async getCartAggregates() {
    const [totalCarts, totalCartItems, cartItemsData] = await Promise.all([
      this.prisma.cart.count(),
      this.prisma.cartItem.count(),
      this.prisma.cartItem.findMany({
        select: {
          quantity: true,
          price: true,
        },
      }),
    ]);

    const totalCartValue = cartItemsData.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );

    const averageCartValue = totalCarts > 0 ? totalCartValue / totalCarts : 0;
    const averageItemsPerCart = totalCarts > 0 ? totalCartItems / totalCarts : 0;

    return {
      totalCarts,
      totalCartItems,
      totalCartValue: parseFloat(totalCartValue.toFixed(2)),
      averageCartValue: parseFloat(averageCartValue.toFixed(2)),
      averageItemsPerCart: parseFloat(averageItemsPerCart.toFixed(2)),
    };
  }
}

