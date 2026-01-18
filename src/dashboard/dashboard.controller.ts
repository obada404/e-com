import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    type: DashboardStatsDto,
  })
  async getDashboardStats(): Promise<DashboardStatsDto> {
    return this.dashboardService.getDashboardStats();
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get overview counts (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Overview counts retrieved successfully',
  })
  async getOverview() {
    return this.dashboardService.getOverviewCounts();
  }

  @Get('products/by-category')
  @ApiOperation({ summary: 'Get products count by category (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Products by category retrieved successfully',
  })
  async getProductsByCategory() {
    return this.dashboardService.getProductsByCategory();
  }

  @Get('recent-activity')
  @ApiOperation({ summary: 'Get recent activity (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Recent activity retrieved successfully',
  })
  async getRecentActivity() {
    return this.dashboardService.getRecentActivity();
  }

  @Get('cart-statistics')
  @ApiOperation({ summary: 'Get cart statistics (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Cart statistics retrieved successfully',
  })
  async getCartStatistics() {
    return this.dashboardService.getCartStatistics();
  }
}


