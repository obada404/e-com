import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { AppConfigService } from './app-config.service';
import { UpdateAboutUsDto } from './dto/update-about-us.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('app-config')
@Controller('app-config')
export class AppConfigController {
  constructor(private readonly appConfigService: AppConfigService) {}

  @Get('about-us')
  @ApiOperation({ summary: 'Get About Us page content (Public)' })
  @ApiResponse({
    status: 200,
    description: 'About Us content retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        aboutUs: { type: 'string', nullable: true },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getAboutUs() {
    return this.appConfigService.getAboutUs();
  }

  @Patch('about-us')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update About Us page content (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'About Us content updated successfully',
  })
  async updateAboutUs(@Body() updateAboutUsDto: UpdateAboutUsDto) {
    return this.appConfigService.updateAboutUs(updateAboutUsDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get app configuration (Admin only)' })
  async getConfig() {
    return this.appConfigService.getConfig();
  }
}
