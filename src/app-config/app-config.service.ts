import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateAboutUsDto } from './dto/update-about-us.dto';

@Injectable()
export class AppConfigService {
  constructor(private prisma: PrismaService) {}

  private readonly CONFIG_ID = 'app-config';

  async getAboutUs() {
    const config = await this.prisma.appConfig.findUnique({
      where: { id: this.CONFIG_ID },
    });

    if (!config) {
      // Create default config if it doesn't exist
      return this.prisma.appConfig.create({
        data: {
          id: this.CONFIG_ID,
          aboutUs: null,
        },
      });
    }

    return config;
  }

  async updateAboutUs(updateAboutUsDto: UpdateAboutUsDto) {
    // Upsert to ensure the config always exists
    return this.prisma.appConfig.upsert({
      where: { id: this.CONFIG_ID },
      update: {
        aboutUs: updateAboutUsDto.aboutUs ?? undefined,
      },
      create: {
        id: this.CONFIG_ID,
        aboutUs: updateAboutUsDto.aboutUs ?? null,
      },
    });
  }

  async getConfig() {
    const config = await this.prisma.appConfig.findUnique({
      where: { id: this.CONFIG_ID },
    });

    if (!config) {
      // Create default config if it doesn't exist
      return this.prisma.appConfig.create({
        data: {
          id: this.CONFIG_ID,
          aboutUs: null,
        },
      });
    }

    return config;
  }
}
