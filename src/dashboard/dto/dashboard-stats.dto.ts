import { ApiProperty } from '@nestjs/swagger';

export class OverviewDto {
  @ApiProperty({ description: 'Total number of users' })
  totalUsers: number;

  @ApiProperty({ description: 'Total number of regular users' })
  totalRegularUsers: number;

  @ApiProperty({ description: 'Total number of admin users' })
  totalAdmins: number;

  @ApiProperty({ description: 'Total number of products' })
  totalProducts: number;

  @ApiProperty({ description: 'Total number of categories' })
  totalCategories: number;

  @ApiProperty({ description: 'Total number of promotions' })
  totalPromotions: number;

  @ApiProperty({ description: 'Number of active promotions' })
  activePromotions: number;

  @ApiProperty({ description: 'Total number of active carts' })
  totalCarts: number;
}

export class ProductsByCategoryDto {
  @ApiProperty({ description: 'Category name' })
  categoryName: string;

  @ApiProperty({ description: 'Number of products in category' })
  productCount: number;
}

export class ProductStatsDto {
  @ApiProperty({ description: 'Total number of products' })
  totalProducts: number;

  @ApiProperty({ description: 'Number of products added in last 7 days' })
  recentProducts: number;

  @ApiProperty({ description: 'Number of products with low stock (<=10)' })
  lowStockProducts: number;

  @ApiProperty({
    description: 'Products grouped by category',
    type: [ProductsByCategoryDto],
  })
  byCategory: ProductsByCategoryDto[];
}

export class UserStatsDto {
  @ApiProperty({ description: 'Total number of users' })
  totalUsers: number;

  @ApiProperty({ description: 'Number of users registered in last 7 days' })
  recentUsers: number;

  @ApiProperty({ description: 'Number of admin users' })
  totalAdmins: number;

  @ApiProperty({ description: 'Number of regular users' })
  totalRegularUsers: number;
}

export class CartStatsDto {
  @ApiProperty({ description: 'Total number of carts' })
  totalCarts: number;

  @ApiProperty({ description: 'Total number of items in all carts' })
  totalCartItems: number;

  @ApiProperty({ description: 'Total value of all cart items' })
  totalCartValue: number;

  @ApiProperty({ description: 'Average cart value' })
  averageCartValue: number;

  @ApiProperty({ description: 'Average number of items per cart' })
  averageItemsPerCart: number;
}

export class DashboardStatsDto {
  @ApiProperty({ description: 'Overview statistics', type: OverviewDto })
  overview: OverviewDto;

  @ApiProperty({ description: 'Product statistics', type: ProductStatsDto })
  products: ProductStatsDto;

  @ApiProperty({ description: 'User statistics', type: UserStatsDto })
  users: UserStatsDto;

  @ApiProperty({ description: 'Cart statistics', type: CartStatsDto })
  cart: CartStatsDto;
}


