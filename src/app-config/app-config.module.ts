import { Module } from '@nestjs/common';
import { AppConfigService } from './app-config.service';
import { AppConfigController } from './app-config.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AppConfigController],
  providers: [AppConfigService, PrismaService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
